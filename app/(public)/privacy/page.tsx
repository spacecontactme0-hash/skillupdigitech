import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionShell } from "@/components/skillup/section-shell"
import { LegalSection } from "@/components/skillup/legal-section"
import { TOCNav, type TOCSection } from "@/components/skillup/toc-nav"
import { getAcademyName } from "@/lib/brand-config"

export const metadata: Metadata = {
  title: `Privacy Policy | ${getAcademyName()}`,
  description: `How ${getAcademyName()} collects, uses, and protects student data.`,
}

const sections: TOCSection[] = [
  { id: "data-collection", label: "Data Collection" },
  { id: "use-of-information", label: "Use of Information" },
  { id: "security", label: "Data Protection and Security" },
  { id: "rights", label: "Your Rights" },
]

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold md:text-5xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last Updated: March 2, 2026</p>
          <p className="text-sm text-muted-foreground">We value transparency and your data protection.</p>
        </header>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TOCNav sections={sections} />
          </aside>
          <article id="legal-content" className="max-w-3xl space-y-4">
            <LegalSection id="data-collection" title="1. Data Collection">
              <p>
                In line with Nigeria Data Protection Regulation (NDPR), we collect only information required to deliver
                your education and certification process.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Personal information: name, contact details, and identification for certification.</li>
                <li>Academic progress: quiz scores, class attendance, and assignment submissions.</li>
                <li>
                  Payment processing: transactions are processed by secure third-party providers such as Paystack or
                  Flutterwave.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="use-of-information" title="2. Use of Information">
              <p>Your data is used solely to support your learning journey and account operations.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Administer training and provide technical support.</li>
                <li>Verify credentials to employers only on your explicit request.</li>
                <li>Send essential updates related to your courses and academy services.</li>
              </ul>
            </LegalSection>

            <LegalSection id="security" title="3. Data Protection and Security">
              <p>
                We apply standard encryption and security protocols to reduce unauthorized access risks. We do not sell or
                lease student data to third-party marketers.
              </p>
            </LegalSection>

            <LegalSection id="rights" title="4. Your Rights">
              <p>
                You may request access to stored data, correction of records, or account deletion after completing your
                program.
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

