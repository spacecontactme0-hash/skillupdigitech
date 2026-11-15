/**
 * Email Verification (OTP) Template
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { renderEmailLayout } from "./base"

export function renderVerificationEmail(params: { name: string; otp: string }): { subject: string; html: string; text: string } {
  const { senderName } = getBrevoConfig()
  const expiryMinutes = process.env.OTP_EXPIRES_MINUTES || "10"

  const subject = `Your ${senderName} verification code: ${params.otp}`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Hi ${params.name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Thank you for registering with <strong>${senderName}</strong>. Please use the single-use verification code below to authenticate your account and verify your email address:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 10px; padding: 18px 36px;">
        <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e40af;">
          ${params.otp}
        </span>
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #64748b; font-weight: 500;">
        Valid for ${expiryMinutes} minutes &bull; Single-use only
      </div>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
        <strong>Security Notice:</strong> The academy faculty and staff will never ask for your verification code. If you did not initiate this request, you can safely ignore this email.
      </p>
    </div>
  `

  const html = renderEmailLayout({
    title: "Verify Your Email Address",
    subtitle: "Complete your account registration",
    badge: "Verification Required",
    badgeColor: "primary",
    contentHtml,
    preheader: `Your verification code is ${params.otp}. Expires in ${expiryMinutes} minutes.`,
  })

  const text = `Hi ${params.name},\n\nYour ${senderName} verification code is: ${params.otp}\n\nThis code is valid for ${expiryMinutes} minutes.\n\nIf you did not request this code, please ignore this email.`

  return { subject, html, text }
}

