/**
 * Tuition Installment Reminder Template (Brevo)
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export interface InstallmentReminderEmailParams {
  studentName: string
  studentEmail: string
  programmeName: string
  installmentAmountNgn: number
  dueDate: string
  isOverdue?: boolean
  paymentLink: string
}

export function renderInstallmentReminderEmail(
  params: InstallmentReminderEmailParams,
): { subject: string; html: string; text: string } {
  const { appUrl } = getBrevoConfig()

  const subject = params.isOverdue
    ? `[URGENT] Overdue Tuition Installment — ${params.programmeName}`
    : `Tuition Installment Reminder — ${params.programmeName}`

  const badgeColor = params.isOverdue ? "danger" : "warning"
  const badgeText = params.isOverdue ? "Overdue Notice" : "Payment Reminder"

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Dear <strong>${params.studentName}</strong>,
    </p>

    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
      ${
        params.isOverdue
          ? `Your tuition installment for <strong>${params.programmeName}</strong> was due on <strong>${params.dueDate}</strong> and is currently overdue. To maintain uninterrupted access to the campus coding labs and learning portal, please complete your payment promptly.`
          : `This is a friendly reminder that your upcoming tuition installment for <strong>${params.programmeName}</strong> is due on <strong>${params.dueDate}</strong>.`
      }
    </p>

    <!-- Payment Breakdown Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b; width: 140px;">Academic Programme:</td>
          <td style="color: #231651; font-weight: 700;">${params.programmeName}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Installment Due:</td>
          <td style="color: #0f172a; font-weight: 700; font-size: 16px;">
            NGN ${params.installmentAmountNgn.toLocaleString()}
          </td>
        </tr>
        <tr>
          <td style="color: #64748b;">Due Date:</td>
          <td style="color: ${params.isOverdue ? "#dc2626" : "#0f172a"}; font-weight: 600;">
            ${params.dueDate} ${params.isOverdue ? "(Overdue)" : ""}
          </td>
        </tr>
        <tr>
          <td style="color: #64748b;">Campus:</td>
          <td style="color: #0f172a;">Enugu Main Learning Centre (14 Garden Avenue, GRA)</td>
        </tr>
      </table>
    </div>

    ${renderPrimaryButton("Pay Installment Now via Paystack", params.paymentLink)}

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 24px 0 0 0;">
      If you have already made this transfer or require financial counseling regarding your payment schedule, please reply directly to this email or visit the administration desk at the Enugu Centre.
    </p>
  `

  const html = renderEmailLayout({
    title: params.isOverdue ? "Tuition Installment Overdue" : "Upcoming Tuition Installment",
    subtitle: params.programmeName,
    badge: badgeText,
    badgeColor,
    contentHtml,
    preheader: `Tuition installment of NGN ${params.installmentAmountNgn.toLocaleString()} due for ${params.programmeName}`,
  })

  const text = `TUITION INSTALLMENT NOTICE\n\nDear ${params.studentName},\n\nYour installment for ${params.programmeName} (NGN ${params.installmentAmountNgn.toLocaleString()}) is ${params.isOverdue ? "OVERDUE" : "due on " + params.dueDate}.\n\nComplete payment here: ${params.paymentLink}\n\nSkillUp Digitech Academy — Enugu Main Learning Centre`

  return { subject, html, text }
}
