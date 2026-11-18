/**
 * Guardian Consent Request Email Template
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { renderEmailLayout } from "./base"

export interface GuardianConsentEmailParams {
  guardianName: string
  guardianEmail: string
  studentName: string
  schoolName?: string
  programmeName: string
  pathwayOrCourseName: string
  deliveryArrangement: string
  byolAcknowledged: boolean
  consentToken: string
}

export function renderGuardianConsentEmail(params: GuardianConsentEmailParams): {
  subject: string
  html: string
  text: string
} {
  const { senderName, appUrl } = getBrevoConfig()
  const verificationUrl = `${appUrl}/guardian-consent?token=${params.consentToken}`

  const subject = `Action Required: Parental Consent for ${params.studentName} at ${senderName}`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Dear ${params.guardianName},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Your child, <strong>${params.studentName}</strong>${params.schoolName ? ` (Student at ${params.schoolName})` : ""}, has applied to join <strong>${senderName}</strong> for the following academic curriculum:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; width: 40%; color: #64748b;">Academic Programme:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${params.programmeName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Track / Course:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${params.pathwayOrCourseName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Delivery Mode:</td>
          <td style="padding: 6px 0; text-transform: capitalize; color: #1e293b;">${params.deliveryArrangement}</td>
        </tr>
        ${
          params.deliveryArrangement === "hybrid"
            ? `<tr>
                <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Laptop Requirement:</td>
                <td style="padding: 6px 0; color: #059669; font-weight: 500;">Acknowledged (Student brings laptop; Academy provides power & internet)</td>
              </tr>`
            : ""
        }
      </table>
    </div>

    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
        <strong>Safeguarding & Minor Protection:</strong> As a secondary school student under 18, our academy enforces strict safety protocols. Peer-to-peer unmoderated adult messaging is disabled, and all instructor communications are monitored for safety.
      </p>
    </div>

    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Please click the button below to confirm your parental consent and allow your child to begin their practical technology journey:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background-color: #231651; color: #D6FFF6; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        Authorize Student Enrolment &rarr;
      </a>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="${verificationUrl}" style="color: #613399; word-break: break-all;">${verificationUrl}</a>
    </p>
  `

  const html = renderEmailLayout({
    title: "Parental Consent Verification",
    subtitle: `Enrollment Authorization for ${params.studentName}`,
    badge: "Safeguarding Required",
    badgeColor: "primary",
    contentHtml,
    preheader: `Parental consent authorization request for ${params.studentName} at ${senderName}.`,
  })

  const text = `Dear ${params.guardianName},\n\nYour child, ${params.studentName}, has registered for ${params.programmeName} (${params.pathwayOrCourseName}) at ${senderName}.\n\nPlease review and authorize their enrollment by visiting:\n${verificationUrl}\n\nThank you,\n${senderName} Academic Team`

  return { subject, html, text }
}
