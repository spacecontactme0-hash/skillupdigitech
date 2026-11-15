/**
 * Payment Confirmation (Receipt) Template
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { PaymentConfirmationParams } from "../types"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export function renderPaymentConfirmationEmail(
  params: {
    name: string
    reference: string
    amount: number
    currency: string
    paymentType?: string
    courseTitle?: string
    paymentDate?: Date
    channel?: string
    to?: string
  },
): { subject: string; html: string; text: string } {
  const { appUrl, senderName } = getBrevoConfig()

  const formattedAmount = `${params.currency.toUpperCase()} ${Number(params.amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  const paymentDate = (params.paymentDate || new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const itemTitle = params.courseTitle || (params.paymentType === "onsite_registration" ? "Onsite Academy Registration & Cohort Access" : "Academy Course Enrollment")

  const subject = `Payment Receipt [${params.reference}] — ${senderName}`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Hi ${params.name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Thank you for your payment! Your transaction has been verified successfully. Your payment receipt details are outlined below:
    </p>

    <!-- Receipt Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px 24px; margin: 24px 0;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b; width: 140px; padding: 6px 0;">Item:</td>
          <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${itemTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Amount Paid:</td>
          <td style="color: #0f172a; font-weight: 700; font-size: 16px; padding: 6px 0;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Transaction Ref:</td>
          <td style="color: #1e40af; font-family: monospace; font-weight: 600; padding: 6px 0;">${params.reference}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Date:</td>
          <td style="color: #334155; padding: 6px 0;">${paymentDate}</td>
        </tr>
        ${
          params.channel
            ? `<tr>
                <td style="color: #64748b; padding: 6px 0;">Channel:</td>
                <td style="color: #334155; text-transform: capitalize; padding: 6px 0;">${params.channel}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="color: #64748b; padding: 6px 0;">Status:</td>
          <td style="color: #16a34a; font-weight: 600; padding: 6px 0;">Completed &bull; Verified</td>
        </tr>
      </table>
    </div>

    ${renderPrimaryButton("View Dashboard & Receipts", `${appUrl}/dashboard/payments`)}

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 24px 0 0 0;">
      This email serves as an official electronic receipt for your records. If you have questions regarding this payment or require invoice documentation, reply to this email.
    </p>
  `

  const html = renderEmailLayout({
    title: "Payment Confirmed",
    subtitle: `Receipt for ${formattedAmount}`,
    badge: "Payment Verified",
    badgeColor: "success",
    contentHtml,
    preheader: `Payment confirmed for ${itemTitle} (${formattedAmount}). Ref: ${params.reference}`,
  })

  const text = `Hi ${params.name},\n\nPayment receipt for ${itemTitle}:\nAmount: ${formattedAmount}\nReference: ${params.reference}\nDate: ${paymentDate}\nStatus: Completed & Verified\n\nView payment dashboard: ${appUrl}/dashboard/payments`

  return { subject, html, text }
}

