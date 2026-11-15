import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionShell } from "@/components/skillup/section-shell"
import { LegalSection } from "@/components/skillup/legal-section"
import { TOCNav, type TOCSection } from "@/components/skillup/toc-nav"
import { getAcademyName } from "@/lib/brand-config"

export const metadata: Metadata = {
  title: `Terms of Service | ${getAcademyName()}`,
  description: `Read the Terms of Service for ${getAcademyName()} training programs and services.`,
}

const sections: TOCSection[] = [
  { id: "introduction", label: "Introduction" },
  { id: "eligibility", label: "Eligibility and Enrollment" },
  { id: "intellectual-property", label: "Intellectual Property Rights" },
  { id: "integrity", label: "Academic Integrity and Conduct" },
  { id: "certification", label: "Certification Disclaimer" },
]

export default function TermsPage() {
  return (
    <div className="pb-12">
      <a href="#legal-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
        Skip to legal content
      </a>

      <SectionShell backgroundType="gradient">
        <header className="mx-auto max-w-3xl space-y-2 text-center">
          <Badge variant="info" className="rounded-full px-4 py-1">
            Legal
          </Badge>
          <h1 className="text-4xl font-bold md:text-5xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Effective Date: Feb 24 2006</p>
          <p className="text-sm text-muted-foreground">We value transparency and your data protection.</p>
        </header>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TOCNav sections={sections} />
          </aside>
          <article id="legal-content" className="max-w-3xl space-y-4">
            <LegalSection id="introduction" title="1. Introduction">
              <p>
                Welcome to SkillUp. By accessing our website, enrolling in
                our courses, or using our training services, you agree to these Terms of Service.
              </p>
            </LegalSection>

            <LegalSection id="eligibility" title="2. Eligibility and Enrollment">
              <p>
                Our programs are professional vocational and engineering courses for individuals aged 9 and above. By enrolling, you
                confirm that your provided information is accurate and complete.
              </p>
            </LegalSection>

            <LegalSection id="intellectual-property" title="3. Intellectual Property Rights">
              <p>
                All course materials including video lectures, manuals, curriculum outlines, and assessment tools are
                exclusive intellectual property of SkillUp.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Recording, downloading (unless explicitly authorized), or redistributing content without written
                  permission is prohibited.
                </li>
                <li>Unauthorized use may result in immediate termination and potential legal action.</li>
              </ul>
            </LegalSection>

            <LegalSection id="integrity" title="4. Academic Integrity and Conduct">
              <p>
                Students must maintain professionalism in live sessions and forums. Harassment, plagiarism, or credential
                sharing may result in permanent expulsion without refund.
              </p>
            </LegalSection>

            <LegalSection id="certification" title="5. Certification Disclaimer">
              <p>
                Certification is awarded only after successful completion of all modules and pass-mark requirements.
                SkillUp does not guarantee immediate employment.
              </p>
            </LegalSection>
          </article>
        </div>
      </SectionShell>

      <SectionShell backgroundType="gradient">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <h2 className="text-2xl font-semibold">Questions About Our Policies?</h2>
          <p className="text-sm text-muted-foreground">Reach out to our admissions and support team for clarification.</p>
          <Button asChild className="h-11 rounded-2xl">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </SectionShell>
    </div>
  )
}

