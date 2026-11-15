/**
 * SkillUp — Centralized Brand Configuration
 *
 * Single source of truth for platform display name, tagline, description, and metadata.
 * Isomorphic and safe for Client Components, Server Components, Route Handlers, and scripts.
 */

export const DEFAULT_ACADEMY_NAME = "SkillUp"
export const DEFAULT_ACADEMY_SHORT_NAME = "SkillUp"
export const DEFAULT_ACADEMY_TAGLINE = "Practical Technology Skills & Engineering Academy"
export const DEFAULT_ACADEMY_DESCRIPTION =
  "Transform your career with practical engineering training. Master modern web development, cloud architecture, artificial intelligence, cybersecurity, and data science from experienced industry practitioners."

/**
 * Resolves the active academy display name.
 * Precedence:
 * 1. NEXT_PUBLIC_APP_NAME environment variable (if defined and non-empty)
 * 2. Fallback: "SkillUp"
 */
export function getAcademyName(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_NAME?.trim()) {
    return process.env.NEXT_PUBLIC_APP_NAME.trim()
  }
  return DEFAULT_ACADEMY_NAME
}

export function getAcademyDescription(): string {
  return DEFAULT_ACADEMY_DESCRIPTION
}

export const brandConfig = {
  get name(): string {
    return getAcademyName()
  },
  shortName: DEFAULT_ACADEMY_SHORT_NAME,
  tagline: DEFAULT_ACADEMY_TAGLINE,
  description: DEFAULT_ACADEMY_DESCRIPTION,
}
