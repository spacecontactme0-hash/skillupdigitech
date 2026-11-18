import assert from "node:assert/strict"
import test, { describe, before } from "node:test"

// Ensure JWT_SECRET is available for token generation tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "phase3-test-jwt-secret-key-32-chars-long"
}

import { studentRegisterSchema } from "../../lib/validation"
import { generateGuardianConsentToken, verifyGuardianConsentToken } from "../../lib/auth"

describe("Phase 3: Registration, Safeguarding & BYOL Rules", () => {
  test("studentRegisterSchema rejects hybrid delivery without BYOL acknowledgement", () => {
    const invalidPayload = {
      registrationType: "online",
      name: "Chukwuma Eze",
      email: "chukwuma@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      phoneNumber: "08012345678",
      programmeCode: "CAREER_READINESS",
      pathwayCode: "SOFTWARE_ENGINEER",
      deliveryArrangement: "hybrid",
      byolAcknowledged: false, // Must be true for hybrid
      studentCategory: "adult",
      acceptTerms: true,
    }

    const result = studentRegisterSchema.safeParse(invalidPayload)
    assert.strictEqual(result.success, false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("byolAcknowledged"))
      assert.ok(issue, "Expected byolAcknowledged validation issue")
      assert.match(issue.message, /Bring Your Own Laptop/i)
    }
  })

  test("studentRegisterSchema accepts hybrid delivery when BYOL is acknowledged", () => {
    const validPayload = {
      registrationType: "online",
      name: "Chukwuma Eze",
      email: "chukwuma@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      phoneNumber: "08012345678",
      programmeCode: "CAREER_READINESS",
      pathwayCode: "SOFTWARE_ENGINEER",
      deliveryArrangement: "hybrid",
      byolAcknowledged: true,
      studentCategory: "adult",
      acceptTerms: true,
    }

    const result = studentRegisterSchema.safeParse(validPayload)
    assert.strictEqual(result.success, true)
  })

  test("studentRegisterSchema rejects minor student when guardian details are missing", () => {
    const minorPayload = {
      registrationType: "online",
      name: "Amaka Nnamdi",
      email: "amaka@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      phoneNumber: "08012345678",
      programmeCode: "CAREER_READINESS",
      pathwayCode: "AI_ENGINEER",
      deliveryArrangement: "online",
      byolAcknowledged: false,
      studentCategory: "minor",
      schoolName: "Queen's College Enugu",
      // Missing guardianName and guardianEmail
      acceptTerms: true,
    }

    const result = studentRegisterSchema.safeParse(minorPayload)
    assert.strictEqual(result.success, false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("guardianName"))
      assert.ok(issue, "Expected guardianName validation issue for minors")
    }
  })

  test("studentRegisterSchema accepts minor student when guardian details are complete", () => {
    const minorPayload = {
      registrationType: "online",
      name: "Amaka Nnamdi",
      email: "amaka@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      phoneNumber: "08012345678",
      programmeCode: "CAREER_READINESS",
      pathwayCode: "AI_ENGINEER",
      deliveryArrangement: "online",
      byolAcknowledged: false,
      studentCategory: "minor",
      schoolName: "Queen's College Enugu",
      guardianName: "Dr. Ngozi Nnamdi",
      guardianEmail: "ngozi.nnamdi@example.com",
      guardianPhone: "08098765432",
      acceptTerms: true,
    }

    const result = studentRegisterSchema.safeParse(minorPayload)
    assert.strictEqual(result.success, true)
  })

  test("Guardian consent token generation and verification roundtrip", () => {
    const studentEmail = "student.test@skillup.ng"
    const guardianEmail = "guardian.test@skillup.ng"

    const token = generateGuardianConsentToken(studentEmail, guardianEmail)
    assert.ok(token, "Token should be generated")

    const decoded = verifyGuardianConsentToken(token)
    assert.ok(decoded, "Token should be verifiable")
    assert.strictEqual(decoded.studentEmail, studentEmail.toLowerCase())
    assert.strictEqual(decoded.guardianEmail, guardianEmail.toLowerCase())
  })

  test("Guardian consent token rejects tampered tokens", () => {
    const token = generateGuardianConsentToken("student@skillup.ng", "guardian@skillup.ng")
    const tampered = token.slice(0, -6) + "xxxxxx"

    const decoded = verifyGuardianConsentToken(tampered)
    assert.strictEqual(decoded, null)
  })
})
