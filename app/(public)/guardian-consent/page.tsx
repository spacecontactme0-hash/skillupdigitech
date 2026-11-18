import { Suspense } from "react"
import { Metadata } from "next"
import { GuardianConsentClient } from "./guardian-consent-client"

export const metadata: Metadata = {
  title: "Parental & Guardian Consent Authorization | SkillUp Digitech Academy",
  description:
    "Review and authorize secondary school student enrolment and minor safeguarding guidelines at SkillUp Digitech Academy.",
}

export default function GuardianConsentPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#231651]" />
          </div>
        }
      >
        <GuardianConsentClient />
      </Suspense>
    </div>
  )
}
