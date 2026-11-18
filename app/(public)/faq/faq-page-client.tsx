"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Script from "next/script"
import { motion } from "framer-motion"
import { Search, Terminal } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionShell } from "@/components/skillup/section-shell"
import { DigitalGridMotif, GrowthPathMotif } from "@/components/brand/motifs"
import { fadeUp, floating, maskReveal, sectionStagger, useReducedMotionSafe } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { getAcademyName } from "@/lib/brand-config"

type FAQItem = {
  question: string
  answer: string
}

type FAQCategory = {
  id: string
  title: string
  intro: string
  questions: FAQItem[]
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "admissions",
    title: "Admissions & Prerequisites",
    intro: "Everything you need to know before enrolling in our technical tracks.",
    questions: [
      {
        question: "Do I need a computer science background to enroll?",
        answer:
          "No. Foundational tracks are designed for beginners with no prior coding experience. We guide you step by step from basic syntax to software architecture.",
      },
      {
        question: "What hardware or software requirements do I need?",
        answer:
          "A computer (Mac, Windows, or Linux) capable of running a modern browser (Chrome, Firefox, or Edge), Node.js, and an IDE such as Visual Studio Code. High-end hardware is not required.",
      },
      {
        question: "Can working professionals study on their own schedule?",
        answer:
          "Yes. All curriculum tracks are self-paced with 24/7 access to digital learning modules, coding exercises, quizzes, and project submission panels.",
      },
    ],
  },
  {
    id: "curriculum",
    title: "Curriculum & Projects",
    intro: "Understand our practical course structure, timelines, and capstones.",
    questions: [
      {
        question: "How long do technical courses take to complete?",
        answer:
          "Programs typically range from 2 to 8 weeks depending on the course depth, complexity, and how many hours you invest each week.",
      },
      {
        question: "Do courses include practical coding exercises?",
        answer:
          "Yes. Every unit combines conceptual explanations with hands-on coding labs, interactive quizzes, and tangible project milestones.",
      },
      {
        question: "What is a capstone project?",
        answer:
          "A capstone is an end-to-end, production-ready software project built from scratch to demonstrate full-stack or specialized domain capability with real code and unit tests.",
      },
      {
        question: "Can I access course materials after completion?",
        answer:
          "Yes. Enrolled students retain ongoing access to their course materials, code references, and completed assignment feedback.",
      },
    ],
  },
  {
    id: "tuition-payment",
    title: "Tuition & Payment",
    intro: "Clear payment expectations, currencies, and refund procedures.",
    questions: [
      {
        question: "What payment options are available?",
        answer:
          "Tuition can be paid securely through our integrated Paystack gateway supporting credit/debit cards, bank transfers, and local currency options.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "Refund requests are governed by our published Refund Policy, accounting for course access status, module progression, and assignment submissions.",
      },
      {
        question: "Can I enroll without creating an account?",
        answer:
          "No. Enrollment is account-gated so your progress, code submissions, rubric evaluations, and certificates are securely tracked.",
      },
    ],
  },
  {
    id: "certification",
    title: "Assessment & Certification",
    intro: "How rubrics, quizzes, and digital certificates work.",
    questions: [
      {
        question: "Will I receive a certificate of completion?",
        answer:
          "Yes. Verified certificates are issued upon passing all required quizzes, coding assignments, and capstone evaluations at the required mastery threshold.",
      },
      {
        question: "How are assignments and capstones evaluated?",
        answer:
          "Submissions are evaluated using criterion-referenced academic rubrics covering code structure, correctness, typing, test coverage, and architecture.",
      },
      {
        question: "Does certification guarantee immediate employment?",
        answer:
          "No educational institution can guarantee hiring. Our certification validates demonstrated technical skills, but hiring decisions depend on individual candidate performance and employer requirements.",
      },
    ],
  },
  {
    id: "career-readiness",
    title: "Career & Portfolio Readiness",
    intro: "How we help you build verifiable proof of your technical ability.",
    questions: [
      {
        question: "Do courses help me build an engineering portfolio?",
        answer:
          "Yes. Capstone projects require you to deliver documented, well-structured GitHub repositories that showcase your code quality directly to technical recruiters.",
      },
      {
        question: "Are the technologies taught aligned with modern industry standards?",
        answer:
          "Yes. Our tracks emphasize widely adopted production stacks including TypeScript, React, Next.js, PostgreSQL, REST/GraphQL APIs, and cloud deployment.",
      },
    ],
  },
]

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text
  const normalized = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${normalized})`, "ig")
  const parts = text.split(regex)

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-primary/20 px-1 text-primary">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

export default function FAQPageClient() {
  const shouldReduceMotion = useReducedMotionSafe()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].id)
  const academyName = getAcademyName()

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_CATEGORIES
    return FAQ_CATEGORIES.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    })).filter((category) => category.questions.length > 0)
  }, [searchQuery])

  useEffect(() => {
    const sections = filteredCategories
      .map((category) => document.getElementById(category.id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          setActiveCategory(visible[0].target.id)
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.2, 0.4, 0.6] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [filteredCategories])

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_CATEGORIES.flatMap((category) =>
        category.questions.map((question) => ({
          "@type": "Question",
          name: question.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: question.answer,
          },
        })),
      ),
    }),
    [],
  )

  return (
    <div className="pb-12">
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative overflow-hidden bg-skillup-hero py-12 text-white md:py-16">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-56 w-80 text-[#D6FFF6] opacity-25" />
        <GrowthPathMotif className="pointer-events-none absolute -right-12 bottom-0 h-56 w-96 text-[#B9A6E8] opacity-55" />

        <motion.div variants={sectionStagger} initial="initial" animate="animate" className="container relative z-10 mx-auto max-w-3xl space-y-5 text-center">
          <Badge variant="mint" className="mx-auto w-fit px-4 py-1 text-xs font-bold">
            <Terminal className="h-3.5 w-3.5" />
            <span>{academyName} Help Center</span>
          </Badge>
          <div className="overflow-hidden">
            <motion.h1 variants={maskReveal} className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Frequently Asked <span className="text-[#D6FFF6]">Questions</span>
            </motion.h1>
          </div>
          <motion.p variants={fadeUp} className="text-sm text-[#E8E3F5]/90 sm:text-base">
            Clear answers on Teen (13–18) &amp; Adult admissions, BYOL lab standards, fixed timetables, Paystack installments, and verifiable certificates.
          </motion.p>
          <motion.div variants={fadeUp} className="mx-auto w-full max-w-xl pt-2">
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5373]" />
              <Input
                id="faq-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search topics, BYOL laptop specs, installments, or certificates..."
                className="h-12 rounded-2xl border-white/20 bg-white pl-10 text-[#150C33] placeholder:text-[#5A5373]"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="container mt-8">
        <nav className="sticky top-20 z-20 mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-border/70 bg-background/90 p-2 backdrop-blur">
          {filteredCategories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className={cn(
                "h-10 rounded-xl border-b-2 border-transparent whitespace-nowrap px-4 text-xs sm:text-sm font-medium",
                activeCategory === category.id ? "border-primary text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                const target = document.getElementById(category.id)
                target?.scrollIntoView({ behavior: "smooth", block: "start" })
                setActiveCategory(category.id)
              }}
            >
              {category.title}
            </Button>
          ))}
        </nav>

        {filteredCategories.length === 0 ? (
          <SectionShell>
            <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card/60 p-8 text-center">
              <h2 className="text-2xl font-semibold">No matching questions found</h2>
              <p className="text-sm text-muted-foreground">
                Try a different keyword or reach out to our technical advisory team for direct support.
              </p>
              <Button asChild className="h-11 rounded-2xl">
                <Link href="/contact">Contact Admissions</Link>
              </Button>
            </div>
          </SectionShell>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category, categoryIndex) => (
              <SectionShell key={category.id}>
                <motion.section
                  id={category.id}
                  variants={sectionStagger}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="mx-auto max-w-3xl space-y-4"
                >
                  <motion.div variants={fadeUp} className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">{category.title}</h2>
                    <p className="text-sm text-muted-foreground">{category.intro}</p>
                  </motion.div>
                  <Accordion type="single" collapsible className="space-y-3">
                    {category.questions.map((faq, index) => (
                      <motion.div
                        key={`${category.id}-${index}`}
                        variants={fadeUp}
                        transition={{ delay: Math.min(categoryIndex * 0.04 + index * 0.03, 0.2) }}
                      >
                        <AccordionItem
                          value={`${category.id}-${index}`}
                          className="overflow-hidden rounded-xl border border-border/70 bg-card/70 px-4 data-[state=open]:border-primary/40"
                        >
                          <AccordionTrigger className="text-left text-sm font-medium leading-6 hover:no-underline">
                            {highlightMatches(faq.question, searchQuery)}
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                            {highlightMatches(faq.answer, searchQuery)}
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    ))}
                  </Accordion>
                </motion.section>
              </SectionShell>
            ))}
          </div>
        )}
      </div>

      <SectionShell variant="split" backgroundType="gradient" hasFloatingAccent className="mt-8">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <motion.div variants={fadeUp} className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Still have questions?</h2>
            <p className="text-muted-foreground">
              Our technical advisors can help you choose the right learning path and review prerequisite requirements.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex lg:justify-end">
            <Button size="lg" variant="cta" asChild className="h-11 rounded-2xl">
              <Link href="/contact">Speak to an Advisor</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>
    </div>
  )
}
