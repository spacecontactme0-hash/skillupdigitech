// Authentication utilities with bcrypt and JWT
import { getDB } from "./db"
import type { PendingRegistration, StudentRegistrationProfile, User } from "./types"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { resolveAppUrl, sendOtpEmail, sendPasswordResetEmail } from "./email"

import { getJwtSecret, isValidSessionToken, verifyToken, type SessionData } from "./session-token"
export { isValidSessionToken, type SessionData }

export type ResendOtpResult =
  | { ok: true }
  | { ok: false; reason: "not_found_or_verified" | "email_send_failed" }

type PendingRegistrationInput = {
  email: string
  password: string
  name: string
  role: "student" | "instructor" | "admin" | "finance"
  studentProfile?: Omit<StudentRegistrationProfile, "submittedAt">
  extraUserFields?: Partial<Pick<User, "bio" | "avatar" | "instructorProfile">>
}

type PendingRegistrationResult = {
  pendingRegistration: Omit<PendingRegistration, "password" | "otpHash">
}

const JWT_SECRET = process.env.JWT_SECRET?.trim()
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d").trim()
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10)
function getAdminAccountEmail(): string | undefined {
  return (process.env.ADMIN_ACCOUNTS_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL)?.trim()
}
function getAdminAccountPassword(): string | undefined {
  return (process.env.ADMIN_ACCOUNTS_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD)?.trim()
}


// Password hashing utility
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

// Password verification utility
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

function generateOtpCode(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0")
}

function sanitizePendingRegistration(registration: PendingRegistration): Omit<PendingRegistration, "password" | "otpHash"> {
  const { password: _password, otpHash: _otpHash, ...safeRegistration } = registration
  return safeRegistration
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  const options: any = {
    expiresIn: JWT_EXPIRES_IN,
  }
  return jwt.sign(payload, getJwtSecret(), options)
}

export function generateGuardianConsentToken(studentEmail: string, guardianEmail: string): string {
  return jwt.sign(
    {
      studentEmail: studentEmail.trim().toLowerCase(),
      guardianEmail: guardianEmail.trim().toLowerCase(),
      type: "guardian_consent",
    },
    getJwtSecret(),
    { expiresIn: "14d" }
  )
}

export function verifyGuardianConsentToken(token: string): { studentEmail: string; guardianEmail: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any
    if (decoded && decoded.type === "guardian_consent" && decoded.studentEmail) {
      return {
        studentEmail: decoded.studentEmail,
        guardianEmail: decoded.guardianEmail,
      }
    }
    return null
  } catch {
    return null
  }
}


async function validateUserPassword(user: User, password: string): Promise<boolean> {
  const isHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$")
  if (isHashed) {
    return verifyPassword(password, user.password)
  }
  return user.password === password
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const db = getDB()
    const normalizedEmail = email?.trim().toLowerCase()
    const adminEmail = getAdminAccountEmail()
    const adminPassword = getAdminAccountPassword()
    const normalizedAdminAccountEmail = adminEmail?.toLowerCase()

    // Check if this is the env admin account first
    if (normalizedAdminAccountEmail && adminPassword && normalizedEmail === normalizedAdminAccountEmail && password === adminPassword) {
      // Try to find existing user first
      let user = await db.findUserByEmail(normalizedEmail)
      const hashedPassword = await hashPassword(password)
      
      if (!user) {
        // Create admin user if it doesn't exist
        try {
          user = await db.createUser({
            email: normalizedEmail,
            password: hashedPassword,
            name: "Admin Account",
            role: "admin",
            status: "active",
            emailVerified: true,
            enrolledCourses: [],
          })
        } catch {
          user = await db.findUserByEmail(normalizedEmail)
          if (!user) throw new Error("Failed to provision administrator account")
        }
      } else {
        // Update user to ensure it's an admin with verified email and matching password
        user = await db.updateUser(user.id, {
          role: "admin",
          status: "active",
          emailVerified: true,
          password: hashedPassword,
        }) || user
      }
      
      const token = generateToken(user)
      const { password: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword as User, token }
    }

    // Regular user login
    const user = await db.findUserByEmail(normalizedEmail)
    if (!user) {
      return null
    }

    let passwordValid = await validateUserPassword(user, password)
    if (passwordValid && !(user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      const hashedPassword = await hashPassword(password)
      await db.updateUser(user.id, { password: hashedPassword })
    }

    if (!passwordValid) {
      return null
    }

    // Require email verification for users who registered via OTP.
    // OTP is only sent during signup and explicit resend actions.
    if (user.emailVerified === false) {
      return null
    }

    // Generate JWT token
    const token = generateToken(user)

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user

    return { user: userWithoutPassword as User, token }
  },

  async validateCredentials(email: string, password: string): Promise<"invalid" | "unverified" | "ok"> {
    const db = getDB()
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return "invalid"

    const user = await db.findUserByEmail(normalizedEmail)
    if (!user) return "invalid"

    const passwordValid = await validateUserPassword(user, password)
    if (!passwordValid) return "invalid"

    if (user.emailVerified === false) {
      return "unverified"
    }

    return "ok"
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor" | "admin" | "finance" = "student"
  ): Promise<{ user: User; token: string }> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.findUserByEmail(normalizedEmail)

    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(password)

    const user = await db.createUser({
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role,
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })

    // Generate JWT token
    const token = generateToken(user)

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user

    return { user: userWithoutPassword as User, token }
  },

  async registerWithOtp(
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor" | "admin" | "finance" = "student",
    studentProfile?: Omit<StudentRegistrationProfile, "submittedAt">,
    extraUserFields?: Partial<Pick<User, "bio" | "avatar" | "instructorProfile">> & {
      studentCategory?: "adult" | "minor"
      dateOfBirth?: Date
      schoolName?: string
      guardianName?: string
      guardianEmail?: string
      guardianPhone?: string
      byolAcknowledged?: boolean
      registrationDraft?: any
    }
  ): Promise<PendingRegistrationResult> {
    if (role === "admin" || role === "finance") {
      throw new Error("Administrative roles cannot be registered via self-service signup")
    }
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.findUserByEmail(normalizedEmail)

    if (existingUser) {
      throw new Error("User already exists")
    }

    const existingPendingRegistration = await db.findPendingRegistrationByEmail(normalizedEmail)
    const hashedPassword = await hashPassword(password)
    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    const emailResult = await sendOtpEmail({ to: normalizedEmail, name, otp })
    if (!emailResult.success) {
      throw new Error(emailResult.error || "Unable to send verification OTP email.")
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n=======================================================`)
      console.log(`[DEV OTP] Verification code for ${normalizedEmail}: ${otp}`)
      console.log(`[DEV OTP] Brevo delivery: ${emailResult.simulated ? "Simulated" : `Sent (ID: ${emailResult.messageId})`}`)
      console.log(`=======================================================\n`)
    }

    const registrationPayload = {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role,
      bio: extraUserFields?.bio,
      avatar: extraUserFields?.avatar,
      instructorProfile: extraUserFields?.instructorProfile,
      studentCategory: extraUserFields?.studentCategory || "adult",
      dateOfBirth: extraUserFields?.dateOfBirth,
      schoolName: extraUserFields?.schoolName,
      guardianName: extraUserFields?.guardianName,
      guardianEmail: extraUserFields?.guardianEmail,
      guardianPhone: extraUserFields?.guardianPhone,
      byolAcknowledged: extraUserFields?.byolAcknowledged || false,
      registrationDraft: extraUserFields?.registrationDraft,
      studentProfile: studentProfile
        ? {
            ...studentProfile,
            submittedAt: new Date(),
          }
        : undefined,
      emailVerified: false,
      otpHash,
      otpExpiresAt,
    }

    const pendingRegistration = existingPendingRegistration
      ? await db.updatePendingRegistration(existingPendingRegistration.id, registrationPayload)
      : await db.createPendingRegistration(registrationPayload)

    if (!pendingRegistration) {
      throw new Error("Failed to save pending registration")
    }

    return { pendingRegistration: sanitizePendingRegistration(pendingRegistration) }
  },

  async verifyOtp(email: string, otp: string): Promise<{ user: User; token: string } | null> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const pendingRegistration = await db.findPendingRegistrationByEmail(normalizedEmail)

    if (pendingRegistration) {
      if (new Date(pendingRegistration.otpExpiresAt).getTime() < Date.now()) {
        return null
      }

      const isValidPendingOtp = await verifyPassword(otp, pendingRegistration.otpHash)
      if (!isValidPendingOtp) {
        return null
      }

      const existingUser = await db.findUserByEmail(normalizedEmail)
      if (existingUser) {
        await db.deletePendingRegistration(pendingRegistration.id)
        return null
      }

      const user = await db.createUser({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        name: pendingRegistration.name,
        role: pendingRegistration.role,
        avatar: pendingRegistration.avatar,
        bio: pendingRegistration.bio,
        instructorProfile: pendingRegistration.instructorProfile,
        studentProfile: pendingRegistration.studentProfile,
        studentCategory: pendingRegistration.studentCategory ?? "adult",
        dateOfBirth: pendingRegistration.dateOfBirth,
        schoolName: pendingRegistration.schoolName,
        guardianConsentStatus: pendingRegistration.studentCategory === "minor" ? "pending" : "not_applicable",
        emailVerified: true,
        enrolledCourses: [],
      })

      // If registration draft contained an academic programme selection, provision programme enrolment
      const draft = pendingRegistration.registrationDraft
      if (draft && draft.programmeCode) {
        try {
          const { programmesDb } = await import("./programmes-db")
          const programme = await programmesDb.getProgrammeByCode(draft.programmeCode)
          if (programme) {
            let pathwayId: string | undefined
            if (draft.pathwayCode) {
              const pathways = await programmesDb.getPathways(programme.id)
              const matched = pathways.find((p) => p.code === draft.pathwayCode)
              pathwayId = matched?.id
            }

            const cohorts = await programmesDb.getCohorts({
              programmeId: programme.id,
              pathwayId,
              deliveryArrangement: draft.deliveryArrangement,
            })
            const defaultCohort = cohorts[0]

            const enrolment = await programmesDb.createProgrammeEnrolment({
              studentId: user.id,
              programmeId: programme.id,
              pathwayId,
              deliveryArrangement: draft.deliveryArrangement || "online",
              cohortId: defaultCohort?.id,
              byolAcknowledged: pendingRegistration.byolAcknowledged,
              status: "pending_payment",
              metadata: {
                draft,
                courseSlug: draft.courseSlug,
                schoolName: pendingRegistration.schoolName,
              },
            })

            if (pendingRegistration.byolAcknowledged) {
              await programmesDb.recordPolicyAcknowledgement({
                userId: user.id,
                programmeEnrolmentId: enrolment.id,
                policyType: "byol_policy",
                policyVersion: "v1.0",
                metadata: {
                  deliveryArrangement: draft.deliveryArrangement,
                  cohortCode: defaultCohort?.code,
                },
              })
            }
          }
        } catch (enrolErr) {
          console.error("Failed to auto-provision programme enrolment on OTP verify:", enrolErr)
        }
      }

      const pendingPayments = await db.getPaymentsByUserId(pendingRegistration.id)
      for (const payment of pendingPayments) {
        await db.updatePayment(payment.id, { userId: user.id })
      }

      await db.deletePendingRegistration(pendingRegistration.id)

      const token = generateToken(user)
      const { password: _password, ...userWithoutPassword } = user
      return { user: userWithoutPassword as User, token }
    }

    const user = await db.findUserByEmail(normalizedEmail)

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return null
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return null
    }

    const isValid = await verifyPassword(otp, user.otpHash)
    if (!isValid) {
      return null
    }

    const updated = await db.updateUser(user.id, {
      emailVerified: true,
      otpHash: undefined,
      otpExpiresAt: undefined,
    })

    if (!updated) return null

    const token = generateToken(updated as User)
    const { password: _, ...userWithoutPassword } = updated as User
    return { user: userWithoutPassword as User, token }
  },

  async resendOtp(email: string): Promise<ResendOtpResult> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const pendingRegistration = await db.findPendingRegistrationByEmail(normalizedEmail)

    if (pendingRegistration) {
      const otp = generateOtpCode()
      const otpHash = await hashPassword(otp)
      const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

      try {
        const emailResult = await sendOtpEmail({ to: normalizedEmail, name: pendingRegistration.name, otp })
        if (!emailResult.success) {
          return { ok: false, reason: "email_send_failed" }
        }
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n=======================================================`)
          console.log(`[DEV OTP] Resent verification code for ${normalizedEmail}: ${otp}`)
          console.log(`[DEV OTP] Brevo delivery: ${emailResult.simulated ? "Simulated" : `Sent (ID: ${emailResult.messageId})`}`)
          console.log(`=======================================================\n`)
        }
        await db.updatePendingRegistration(pendingRegistration.id, { otpHash, otpExpiresAt })
        return { ok: true }
      } catch (error) {
        console.error("Failed to resend OTP email:", error)
        return { ok: false, reason: "email_send_failed" }
      }
    }

    const user = await db.findUserByEmail(normalizedEmail)

    if (!user || user.emailVerified) {
      return { ok: false, reason: "not_found_or_verified" }
    }

    const otp = generateOtpCode()
    const otpHash = await hashPassword(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)

    await db.updateUser(user.id, { otpHash, otpExpiresAt })
    try {
      const emailResult = await sendOtpEmail({ to: normalizedEmail, name: user.name, otp })
      if (!emailResult.success) {
        return { ok: false, reason: "email_send_failed" }
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n=======================================================`)
        console.log(`[DEV OTP] Resent verification code for ${normalizedEmail}: ${otp}`)
        console.log(`[DEV OTP] Brevo delivery: ${emailResult.simulated ? "Simulated" : `Sent (ID: ${emailResult.messageId})`}`)
        console.log(`=======================================================\n`)
      }
      return { ok: true }
    } catch (error) {
      console.error("Failed to resend OTP email:", error)
      return { ok: false, reason: "email_send_failed" }
    }
  },

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const db = getDB()
    const user = await db.findUserById(userId)
    if (!user) return false

    const isValid = await validateUserPassword(user, currentPassword)
    if (!isValid) return false

    const hashedPassword = await hashPassword(newPassword)
    await db.updateUser(userId, { password: hashedPassword })
    return true
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.findUserByEmail(normalizedEmail)
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return true
    }

    const resetToken = generateOtpCode()
    const resetTokenHash = await hashPassword(resetToken)
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.updateUser(user.id, {
      otpHash: resetTokenHash,
      otpExpiresAt: resetTokenExpiresAt,
    })

    // Send reset email via canonical, production-guarded URL
    const baseUrl = resolveAppUrl()
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`
    
    try {
      const emailResult = await sendPasswordResetEmail({ to: normalizedEmail, name: user.name, resetUrl, token: resetToken })
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n=======================================================`)
        console.log(`[DEV RESET] Password reset token for ${normalizedEmail}: ${resetToken}`)
        console.log(`[DEV RESET] Brevo delivery: ${emailResult.simulated ? "Simulated" : `Sent (ID: ${emailResult.messageId})`}`)
        console.log(`=======================================================\n`)
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      // Never log sensitive reset tokens or raw reset URLs containing tokens
    }

    return true
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    const db = getDB()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.findUserByEmail(normalizedEmail)
    
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return false
    }

    // Check if token is expired
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return false
    }

    // Verify token
    const isValid = await verifyPassword(token, user.otpHash)
    if (!isValid) {
      return false
    }

    // Update password and clear reset token
    const hashedPassword = await hashPassword(newPassword)
    await db.updateUser(user.id, {
      password: hashedPassword,
      otpHash: undefined,
      otpExpiresAt: undefined,
    })

    return true
  },

  async getCurrentUser(token: string): Promise<User | null> {
    const decoded = verifyToken(token)

    if (!decoded) {
      return null
    }

    const db = getDB()
    const user = await db.findUserById(decoded.userId)

    if (!user) {
      return null
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  },

  decodeToken(token: string): SessionData | null {
    return verifyToken(token)
  },
}


