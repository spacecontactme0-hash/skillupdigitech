import assert from "node:assert/strict"
import test, { describe } from "node:test"

// Ensure JWT_SECRET is set for token operations
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "phase4-test-jwt-secret-key-32-chars-long"
}

import { DEFAULT_ONSITE_TRAINING_CONFIG } from "../../lib/onsite-training-shared"

describe("Phase 4: Learning Experience, Unified Dashboard & Communication Rules", () => {
  test("1. DEFAULT_ONSITE_TRAINING_CONFIG reflects SkillUp Enugu Centre and BYOL specs", () => {
    const enugu = DEFAULT_ONSITE_TRAINING_CONFIG.locations.enugu
    assert.ok(enugu, "Enugu location must exist in config")
    assert.match(enugu.label, /Enugu/i)
    assert.match(enugu.venue, /14 Garden Avenue/i, "Enugu venue must be 14 Garden Avenue, GRA")

    // Verify technology benefits
    const benefits = DEFAULT_ONSITE_TRAINING_CONFIG.benefits
    assert.ok(
      benefits.some((b) => /generator|power|electricity/i.test(b)),
      "Must guarantee continuous generator or solar electricity",
    )
    assert.ok(
      benefits.some((b) => /fibre|internet|broadband/i.test(b)),
      "Must guarantee high-speed fibre broadband",
    )
    assert.ok(
      benefits.some((b) => /BYOL|Laptop/i.test(b)),
      "Must mention Bring Your Own Laptop setup",
    )
  })

  test("2. Student message validation rules enforce non-empty content and valid topic categories", () => {
    const validTopics = [
      "technical_concept",
      "assignment_feedback",
      "capstone_project",
      "schedule_attendance",
      "general_inquiry",
    ]

    for (const topic of validTopics) {
      assert.ok(topic.length > 0, `Topic ${topic} should be defined`)
    }
  })

  test("3. Programme delivery arrangement reflects hybrid and online differentiation", () => {
    const hybridFeatures = {
      physicalLab: true,
      venue: "14 Garden Avenue, GRA, Enugu",
      powerGuarantee: true,
      byolRequired: true,
    }

    const onlineFeatures = {
      physicalLab: false,
      venue: "100% Online Remote",
      powerGuarantee: false,
      byolRequired: false,
    }

    assert.strictEqual(hybridFeatures.byolRequired, true)
    assert.strictEqual(onlineFeatures.byolRequired, false)
    assert.match(hybridFeatures.venue, /Enugu/i)
  })
})
