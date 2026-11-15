/**
 * Curriculum Review Notification Templates
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { LessonReviewApprovedParams, LessonReviewRejectedParams } from "../types"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export function renderLessonApprovedEmail(params: {
  name: string
  courseTitle: string
  lessonTitle: string
  to?: string
}): { subject: string; html: string; text: string } {
  const { appUrl, senderName } = getBrevoConfig()

  const subject = `Lesson Approved: "${params.lessonTitle}" in ${params.courseTitle}`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Hi ${params.name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Great news! The academic review committee has reviewed and approved your lesson <strong>"${params.lessonTitle}"</strong> in course <strong>"${params.courseTitle}"</strong>.
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      The lesson is now live and accessible to enrolled learners across the academy.
    </p>

    ${renderPrimaryButton("Open Faculty Workspace", `${appUrl}/instructor`)}

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
        You can now monitor student quiz performance, review assignment code submissions, and answer discussions directly from your instructor workspace.
      </p>
    </div>
  `

  const html = renderEmailLayout({
    title: "Lesson Approved",
    subtitle: `"${params.lessonTitle}" is published`,
    badge: "Curriculum Approved",
    badgeColor: "success",
    contentHtml,
    preheader: `Your lesson "${params.lessonTitle}" was approved and is now live.`,
  })

  const text = `Hi ${params.name},\n\nYour lesson "${params.lessonTitle}" in "${params.courseTitle}" has been approved and published to learners at ${senderName}.\n\nWorkspace: ${appUrl}/instructor`

  return { subject, html, text }
}

export function renderLessonRejectedEmail(params: {
  name: string
  courseTitle: string
  lessonTitle: string
  note?: string
  to?: string
}): { subject: string; html: string; text: string } {
  const { appUrl, senderName } = getBrevoConfig()

  const subject = `Curriculum Review: Revisions Requested for "${params.courseTitle}"`

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      Hi ${params.name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      The academic review committee has evaluated your lesson <strong>"${params.lessonTitle}"</strong> in course <strong>"${params.courseTitle}"</strong> and requested revisions before publication.
    </p>

    <!-- Reviewer Notes -->
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">
        Reviewer Feedback & Notes:
      </h4>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">
        ${params.note || "No specific note provided. Please check curriculum objectives, code snippet accuracy, and lesson completeness."}
      </p>
    </div>

    ${renderPrimaryButton("Review & Edit Lesson", `${appUrl}/instructor`)}

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
      Once you have made the necessary adjustments, resubmit the lesson for review from your faculty workspace.
    </p>
  `

  const html = renderEmailLayout({
    title: "Revisions Requested",
    subtitle: `Changes needed for "${params.lessonTitle}"`,
    badge: "Action Required",
    badgeColor: "danger",
    contentHtml,
    preheader: `Revisions requested for your lesson "${params.lessonTitle}".`,
  })

  const text = `Hi ${params.name},\n\nThe academic review committee requested changes for your lesson "${params.lessonTitle}" in "${params.courseTitle}".\n\nFeedback: ${params.note || "Please check curriculum objectives and completeness."}\n\nWorkspace: ${appUrl}/instructor`

  return { subject, html, text }
}

