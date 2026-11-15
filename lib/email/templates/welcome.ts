/**
 * Welcome Email Template (Role-Tailored)
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

import { getBrevoConfig } from "../client"
import { WelcomeEmailRole } from "../types"
import { renderEmailLayout, renderPrimaryButton } from "./base"

export function renderWelcomeEmail(params: { name: string; role?: string }): { subject: string; html: string; text: string } {
  const { appUrl, senderName } = getBrevoConfig()

  const role: WelcomeEmailRole =
    params.role === "instructor" ||
    params.role === "admin" ||
    params.role === "finance" ||
    params.role === "student"
      ? params.role
      : "student"

  const content: Record<
    WelcomeEmailRole,
    {
      subject: string
      title: string
      badge: string
      intro: string
      buttonText: string
      buttonUrl: string
      highlights: string[]
      closing: string
    }
  > = {
    student: {
      subject: `Welcome to ${senderName} — Start Your Technical Journey`,
      title: "Welcome to the Academy",
      badge: "Student Account Active",
      intro: `Hi ${params.name}, your student account has been verified and activated. You now have access to industry-aligned engineering tracks, practical hands-on projects, and faculty evaluations.`,
      buttonText: "Go to Student Dashboard",
      buttonUrl: `${appUrl}/dashboard`,
      highlights: [
        "Explore curricula across Full-Stack Web Development, Cloud & DevOps, AI/ML, and Cybersecurity.",
        "Solve practical programming challenges, complete quizzes, and submit code assignments.",
        "Build a verified technical portfolio and earn skill credentials as you finish courses.",
        "Connect with instructors and receive direct code reviews on your capstone submissions.",
      ],
      closing: "If you need any guidance getting started with your tracks, reply directly to this email.",
    },
    instructor: {
      subject: `Welcome to the ${senderName} Faculty Portal`,
      title: "Your Faculty Workspace is Ready",
      badge: "Faculty Account Verified",
      intro: `Hi ${params.name}, your instructor account is active. This is your technical workspace for authoring curricula, publishing modules, and evaluating student submissions.`,
      buttonText: "Open Instructor Portal",
      buttonUrl: `${appUrl}/instructor`,
      highlights: [
        "Complete your engineering bio, GitHub repository links, and domain specialties.",
        "Create practical lesson modules, code exercises, quizzes, and rubrics.",
        "Submit new courses for academic committee review prior to student enrollment.",
        "Grade student assignment submissions and provide detailed feedback on capstone code.",
      ],
      closing: "For curriculum guidelines or rubric assistance, our academic operations team is here to help.",
    },
    admin: {
      subject: `Welcome to ${senderName} Operations Command`,
      title: "Operations Workspace Ready",
      badge: "Administrator Account",
      intro: `Hi ${params.name}, your administrator account is active. You have full access to platform operations, curriculum review queues, taxonomy management, and system logs.`,
      buttonText: "Open Admin Workspace",
      buttonUrl: `${appUrl}/admin`,
      highlights: [
        "Review courses and lessons submitted by faculty for publication.",
        "Monitor student onboarding, active enrollments, and platform health.",
        "Audit payment verification logs and oversee student accounts.",
        "If you were provisioned with a temporary password, please update your credentials immediately.",
      ],
      closing: "For systems assistance or policy coordination, contact the engineering team.",
    },
    finance: {
      subject: `Welcome to ${senderName} Financial Operations`,
      title: "Finance & Reconciliation Workspace",
      badge: "Finance Account",
      intro: `Hi ${params.name}, your finance account is active. You have access to transaction ledgers, Paystack payment reconciliations, and financial reporting across supported currencies.`,
      buttonText: "Open Finance Dashboard",
      buttonUrl: `${appUrl}/finance`,
      highlights: [
        "Monitor verified Paystack transactions across NGN, USD, EUR, and GBP.",
        "Review flagged transactions requiring manual verification.",
        "Reconcile payment references against student enrollments.",
        "Update your temporary credentials upon first sign-in.",
      ],
      closing: "For billing system queries or ledger auditing assistance, reach out directly to the operations desk.",
    },
  }

  const selected = content[role]

  const highlightsHtml = selected.highlights
    .map(
      (item) => `
      <li style="margin-bottom: 10px; padding-left: 4px;">
        <span style="color: #1e293b; font-size: 14px;">${item}</span>
      </li>
    `,
    )
    .join("")

  const contentHtml = `
    <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.6;">
      ${selected.intro}
    </p>

    ${renderPrimaryButton(selected.buttonText, selected.buttonUrl)}

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 28px 0 24px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
        Key Capabilities & Next Steps
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px;">
        ${highlightsHtml}
      </ul>
    </div>

    <p style="margin: 20px 0 0 0; font-size: 14px; color: #475569;">
      ${selected.closing}
    </p>
  `

  const html = renderEmailLayout({
    title: selected.title,
    badge: selected.badge,
    badgeColor: "primary",
    contentHtml,
    preheader: selected.intro.slice(0, 120),
  })

  const text = `${selected.title}\n\n${selected.intro}\n\nAccess your workspace: ${selected.buttonUrl}\n\n${selected.closing}`

  return { subject: selected.subject, html, text }
}

