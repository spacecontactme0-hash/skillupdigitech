/**
 * Course Enrollment Confirmation Template
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { EnrollmentConfirmationParams } from "../types"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export function renderEnrollmentConfirmationEmail(
  params: {
    name: string
    courseTitle: string
    courseSlug?: string
    trackName?: string
    instructorName?: string
    to?: string
  },
): { subject: string; html: string; text: string } {
  const { appUrl, senderName } = getBrevoConfig()

  const subject = `Enrollment Confirmed: "${params.courseTitle}" — ${senderName}`
  const courseUrl = params.courseSlug ? `${appUrl}/courses/${params.courseSlug}` : `${appUrl}/dashboard`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Hi ${params.name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Congratulations! You are officially enrolled in <strong>"${params.courseTitle}"</strong> at <strong>${senderName}</strong>. Your learning workspace is ready.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
        Course Details
      </h3>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
        <tr>
          <td style="color: #64748b; width: 120px; padding: 4px 0;">Course:</td>
          <td style="color: #0f172a; font-weight: 600; padding: 4px 0;">${params.courseTitle}</td>
        </tr>
        ${
          params.trackName
            ? `<tr>
                <td style="color: #64748b; padding: 4px 0;">Track:</td>
                <td style="color: #0f172a; font-weight: 500; padding: 4px 0;">${params.trackName}</td>
              </tr>`
            : ""
        }
        ${
          params.instructorName
            ? `<tr>
                <td style="color: #64748b; padding: 4px 0;">Instructor:</td>
                <td style="color: #0f172a; font-weight: 500; padding: 4px 0;">${params.instructorName}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Status:</td>
          <td style="color: #16a34a; font-weight: 600; padding: 4px 0;">Active Enrollment</td>
        </tr>
      </table>
    </div>

    ${renderPrimaryButton("Start Learning Now", courseUrl)}

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #1e40af;">
        How to get the most out of your course:
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 13px; line-height: 1.5;">
        <li style="margin-bottom: 4px;">Follow lessons in sequence and work through all code walkthroughs.</li>
        <li style="margin-bottom: 4px;">Complete every module quiz to validate conceptual retention.</li>
        <li style="margin-bottom: 4px;">Submit all code assignments and your final capstone project.</li>
        <li>Earn your verified course credential upon full curriculum completion.</li>
      </ul>
    </div>
  `

  const html = renderEmailLayout({
    title: "Enrollment Confirmed",
    subtitle: `You now have access to ${params.courseTitle}`,
    badge: "Course Access Granted",
    badgeColor: "success",
    contentHtml,
    preheader: `You're enrolled in ${params.courseTitle}. Start learning today!`,
  })

  const text = `Hi ${params.name},\n\nYou are enrolled in "${params.courseTitle}" at ${senderName}.\n\nAccess your course: ${courseUrl}`

  return { subject, html, text }
}

