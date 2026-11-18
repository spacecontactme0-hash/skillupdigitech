import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService, generateGuardianConsentToken } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { sendGuardianConsentEmail } from "@/lib/email"
import { recordOnboardingEvent } from "@/lib/onboarding-event-log"
import { buildVerifyOtpRoute, getOtpResendCooldownSeconds } from "@/lib/onboarding-flow"
import { getTrainingLocationStartDate, ONLINE_TRAINING } from "@/lib/student-registration"
import { studentRegisterSchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = studentRegisterSchema.parse(body)
    const role = "student"
    const normalizedEmail = validated.email.trim().toLowerCase()

    // Existing-account check for multi-programme enrolment prompt
    const db = getDB()
    const existingUser = await db.findUserByEmail(normalizedEmail)
    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Sign in to add this programme to your existing dashboard.",
          code: "ACCOUNT_EXISTS",
          email: normalizedEmail,
        },
        { status: 409 },
      )
    }

    const extraUserFields = {
      studentCategory: validated.studentCategory,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      schoolName: validated.schoolName,
      guardianName: validated.guardianName,
      guardianEmail: validated.guardianEmail || undefined,
      guardianPhone: validated.guardianPhone || undefined,
      byolAcknowledged: validated.byolAcknowledged,
      registrationDraft: {
        programmeCode: validated.programmeCode,
        pathwayCode: validated.pathwayCode,
        courseSlug: validated.courseSlug,
        deliveryArrangement: validated.deliveryArrangement,
        studentCategory: validated.studentCategory,
        schoolName: validated.schoolName,
        gradeLevel: validated.gradeLevel,
      },
    }

    const isHybrid = validated.deliveryArrangement === "hybrid"
    const result = await authService.registerWithOtp(
      validated.email,
      validated.password,
      validated.name,
      role,
      {
        trainingMode: isHybrid ? "onsite" : "online",
        formTitle: validated.programmeCode === "CAREER_READINESS" ? "Career Readiness Programme" : "Skill Acquisition Programme",
        phoneNumber: validated.phoneNumber,
        whatsappNumber: validated.whatsappNumber?.trim() || validated.phoneNumber,
        gender: "prefer_not_to_say",
        dateOfBirth: validated.dateOfBirth || "",
        currentAddress: "",
        isHealthcareProfessional: false,
        currentRoleOrField: "",
        preferredLocation: "enugu",
        preferredLocationStartDate: getTrainingLocationStartDate("enugu"),
        trainingInterest: validated.pathwayCode || validated.courseSlug || "",
        registrationFeeNgn: 0,
        paymentStatus: "no",
        paymentLink: "",
        agreedSlotSecured: false,
        agreedDetailsCorrect: true,
      },
      extraUserFields,
    )

    // Minor Safeguarding: Queue Brevo parental consent request if applicant is a secondary school minor
    if (validated.studentCategory === "minor" && validated.guardianEmail) {
      const consentToken = generateGuardianConsentToken(validated.email, validated.guardianEmail)
      sendGuardianConsentEmail({
        guardianEmail: validated.guardianEmail,
        guardianName: validated.guardianName || "Parent / Guardian",
        studentName: validated.name,
        schoolName: validated.schoolName,
        programmeName: validated.programmeCode === "CAREER_READINESS" ? "Career Readiness Programme" : "Skill Acquisition Programme",
        pathwayOrCourseName: validated.pathwayCode || validated.courseSlug || "Technology Track",
        deliveryArrangement: validated.deliveryArrangement,
        byolAcknowledged: validated.byolAcknowledged,
        consentToken,
      }).catch((err) => {
        console.error("Non-blocking guardian consent email dispatch failure:", err)
      })
    }

    const otpResendCooldownSeconds = getOtpResendCooldownSeconds()
    await recordOnboardingEvent({
      name: "signup_submitted",
      role,
      mode: isHybrid ? "onsite" : "online",
      source: "signup",
      status: "pending_otp",
    })

    return NextResponse.json({
      success: true,
      pendingRegistration: result.pendingRegistration,
      message: "OTP sent to email",
      email: normalizedEmail,
      role,
      mode: isHybrid ? "onsite" : "online",
      programmeCode: validated.programmeCode,
      deliveryArrangement: validated.deliveryArrangement,
      studentCategory: validated.studentCategory,
      nextRoute: buildVerifyOtpRoute({
        email: validated.email,
        role,
        source: "signup",
        cooldownSeconds: otpResendCooldownSeconds,
      }),
      otpResendCooldownSeconds,
    })
  } catch (error) {
    console.error("Register error:", error)
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Sign in to add this programme to your existing dashboard.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 },
      )
    }
    if (error instanceof Error && error.message === "Failed to save pending registration") {
      return NextResponse.json({ error: "Registration failed after OTP dispatch. Please try again." }, { status: 500 })
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && /send/i.test(error.message) && /otp|email/i.test(error.message)) {
      return NextResponse.json({ error: "Unable to send OTP email. No account was created." }, { status: 502 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
