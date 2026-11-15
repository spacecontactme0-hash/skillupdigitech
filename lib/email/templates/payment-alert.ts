/**
 * Payment Manual Review Alert Template (Admin / Finance)
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { PaymentManualReviewAlertParams } from "../types"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export function renderPaymentManualReviewAlertEmail(
  params: PaymentManualReviewAlertParams,
): { subject: string; html: string; text: string } {
  const { appUrl, senderName } = getBrevoConfig()

  const subject = `[Action Required] Payment Manual Review — Ref ${params.reference}`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      A transaction has been flagged by the automated payment verification system and requires administrative evaluation.
    </p>

    <!-- Discrepancy Card -->
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
        Flag Reason:
      </h4>
      <p style="margin: 0; font-size: 14px; color: #78350f; font-weight: 500;">
        ${params.reason}
      </p>
    </div>

    <!-- Details Table -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 22px; margin: 24px 0;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b; width: 130px; padding: 4px 0;">Reference:</td>
          <td style="color: #0f172a; font-family: monospace; font-weight: 600; padding: 4px 0;">${params.reference}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Expected Amount:</td>
          <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${params.currency} ${Number(params.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Payment Type:</td>
          <td style="color: #0f172a; padding: 4px 0;">${params.paymentType || "Course / Onsite"}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">User Email:</td>
          <td style="color: #0f172a; padding: 4px 0;">${params.userEmail || "Unspecified"}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Detection Source:</td>
          <td style="color: #0f172a; padding: 4px 0;">${params.source}</td>
        </tr>
      </table>
    </div>

    ${renderPrimaryButton("Review Payment in Admin", `${appUrl}/admin/payments/verify`)}

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
      Please inspect the Paystack dashboard or the admin verification interface to approve or reject this transaction.
    </p>
  `

  const html = renderEmailLayout({
    title: "Payment Flagged for Review",
    subtitle: `Reference: ${params.reference}`,
    badge: "Operations Alert",
    badgeColor: "warning",
    contentHtml,
    preheader: `Payment ${params.reference} flagged: ${params.reason}`,
  })

  const text = `PAYMENT MANUAL REVIEW REQUIRED\n\nReference: ${params.reference}\nAmount: ${params.currency} ${params.amount}\nReason: ${params.reason}\nUser: ${params.userEmail || "N/A"}\nSource: ${params.source}\n\nReview: ${appUrl}/admin/payments/verify`

  return { subject, html, text }
}

