/**
 * Password Reset Email Template
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export function renderPasswordResetEmail(params: {
  name: string
  resetUrl: string
  token: string
}): { subject: string; html: string; text: string } {
  const { senderName } = getBrevoConfig()

  const subject = `Reset your ${senderName} password`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Hi ${params.name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      We received a request to reset the password for your <strong>${senderName}</strong> account. Click the button below to choose a new password:
    </p>

    ${renderPrimaryButton("Reset Password", params.resetUrl)}

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
        Alternative Direct Link
      </p>
      <p style="margin: 0; font-size: 12px; color: #0284c7; word-break: break-all; font-family: monospace;">
        <a href="${params.resetUrl}" style="color: #2563eb; text-decoration: underline;">${params.resetUrl}</a>
      </p>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 14px 18px; margin: 24px 0;">
      <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #1e40af;">
        Verification Code Backup:
      </p>
      <p style="margin: 0; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 20px; font-weight: 700; letter-spacing: 4px; color: #1e3a8a;">
        ${params.token}
      </p>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
      This reset link is single-use and will expire in <strong>1 hour</strong>. If you did not request a password reset, no action is needed and your account remains secure.
    </p>
  `

  const html = renderEmailLayout({
    title: "Password Reset Request",
    subtitle: "Secure account recovery",
    badge: "Security Action",
    badgeColor: "warning",
    contentHtml,
    preheader: "Click to reset your password or use your 1-hour verification token.",
  })

  const text = `Hi ${params.name},\n\nWe received a request to reset your password for ${senderName}.\n\nReset your password here:\n${params.resetUrl}\n\nVerification code: ${params.token}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`

  return { subject, html, text }
}

