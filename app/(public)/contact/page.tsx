"use client"

import type React from "react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionShell } from "@/components/skillup/section-shell"
import { ConnectedThinkingMotif, DigitalGridMotif } from "@/components/brand/motifs"
import { contactSchema } from "@/lib/validation"
import { fadeUp, floating, hoverLift, maskReveal, sectionStagger, useReducedMotionSafe } from "@/lib/motion"
import { Mail, MapPin, MessageCircle, Phone, ShieldCheck, Clock3, CircleCheckBig, Terminal, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAcademyName } from "@/lib/brand-config"

type ContactFormData = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>

const defaultForm: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
}

function FormInputField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  placeholder = "",
}: {
  id: keyof ContactFormData
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: "text" | "email" | "tel"
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-foreground">
        {label} {required ? <span className="text-primary">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function FormTextareaField({
  id,
  label,
  value,
  onChange,
  error,
  required = true,
  placeholder = "",
}: {
  id: keyof ContactFormData
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-foreground">
        {label} {required ? <span className="text-primary">*</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function ContactPage() {
  const { toast } = useToast()
  const shouldReduceMotion = useReducedMotionSafe()
  const [formData, setFormData] = useState<ContactFormData>(defaultForm)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const academyName = getAcademyName()

  const contactOptions = useMemo(
    () => [
      {
        icon: Phone,
        title: "Call Admissions",
        description: "Speak directly with academic advisors during office hours.",
        cta: "Call now",
        href: "tel:+2349030910091",
      },
      {
        icon: MessageCircle,
        title: "WhatsApp Advisor",
        description: "Get quick answers on technical tracks, curriculum, and enrollments.",
        cta: "Start chat",
        href: "https://wa.me/2349030910091",
      },
      {
        icon: Mail,
        title: "Email Support",
        description: "Send curriculum inquiries, course requests, or account questions.",
        cta: "Send email",
        href: "mailto:admissions@skillup-digitech.com.ng",
      },
      {
        icon: MapPin,
        title: "Visit Campus",
        description: "Explore our Enugu Learning Centre computer labs and practical facilities.",
        cta: "Get directions",
        href: "https://maps.google.com/?q=14+Garden+Avenue,+GRA,+Enugu,+Enugu+State,+Nigeria",
      },
    ],
    [],
  )

  const updateField = <T extends keyof ContactFormData>(field: T, value: ContactFormData[T]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitted(false)

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    }

    const validation = contactSchema.safeParse(payload)
    const nextErrors: ContactFormErrors = {}
    if (!validation.success) {
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as keyof ContactFormData
        nextErrors[path] = issue.message
      }
    }
    if (formData.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(formData.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number."
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmitting(false)
    setSubmitted(true)
    setFormData(defaultForm)
    toast({
      title: "Inquiry received",
      description: "Our technical advisors will respond within 24 hours.",
    })
  }

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-white/10 bg-skillup-hero py-12 text-white md:py-20">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-56 w-80 text-[#D6FFF6] opacity-25" />
        <ConnectedThinkingMotif className="pointer-events-none absolute -right-10 bottom-0 h-60 w-96 text-[#B9A6E8] opacity-55" />

        <motion.div variants={sectionStagger} initial="initial" animate="animate" className="container relative z-10 mx-auto max-w-3xl space-y-4 text-center">
          <Badge variant="mint" className="px-4 py-1 text-xs font-bold">
            <Terminal className="h-3.5 w-3.5" />
            Admissions &amp; Enugu Campus Inquiries
          </Badge>
          <div className="overflow-hidden">
            <motion.h1 variants={maskReveal} className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Let&apos;s plan your{" "}
              <span className="text-[#D6FFF6]">next step</span>{" "}
              in technology.
            </motion.h1>
          </div>
          <motion.p variants={fadeUp} className="text-sm leading-relaxed text-[#E8E3F5]/90 sm:text-base">
            Connect with our academic advisors for teens (13–18) or adult cohorts, BYOL guidance, or an in-person tour at 14 Garden Avenue, GRA, Enugu.
          </motion.p>
          <motion.p variants={fadeUp} className="font-mono text-xs text-[#C4BBE0]">
            Admissions responses typically sent within 24 hours on business days.
          </motion.p>
        </motion.div>
      </section>

      <SectionShell className="py-10 md:py-14">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {contactOptions.map((option) => (
            <motion.a
              key={option.title}
              href={option.href}
              target={option.href.startsWith("http") ? "_blank" : undefined}
              rel={option.href.startsWith("http") ? "noreferrer" : undefined}
              variants={fadeUp}
              {...hoverLift()}
              className="group rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all duration-200 hover:border-accent/40 hover:shadow-lifted"
            >
              <option.icon className="h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{option.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{option.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors duration-200">
                {option.cta} &rarr;
              </span>
            </motion.a>
          ))}
        </motion.div>
      </SectionShell>

      <SectionShell id="contact-form" variant="split" hasParallax className="bg-muted/20 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,1.1fr)] lg:items-start">
          <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-4">
            <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Direct Contact
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight md:text-4xl">
              Tell us your learning goals. We&apos;ll guide you clearly.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
              Whether you are an aspiring software engineer, transitioning from another industry, or selecting training for your technical team, our advisors provide direct guidance.
            </motion.p>
            <motion.ul variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="space-y-3 pt-2">
              {["Fast 24-hour business response", "Transparent curriculum prerequisites", "Structured assessment guidance"].map((item) => (
                <motion.li key={item} variants={fadeUp} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div variants={fadeUp} initial="initial" whileInView="animate" viewport={{ once: true }}>
            <Card className="rounded-2xl border-border/80 bg-card shadow-lifted">
              <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-primary to-accent" />
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <FormInputField
                    id="name"
                    label="Full Name"
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    onChange={(value) => updateField("name", value)}
                    error={errors.name}
                    required
                  />
                  <FormInputField
                    id="email"
                    type="email"
                    label="Email Address"
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={(value) => updateField("email", value)}
                    error={errors.email}
                    required
                  />
                  <FormInputField
                    id="phone"
                    type="tel"
                    label="Phone Number (Optional)"
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value)}
                    error={errors.phone}
                  />

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="block text-xs font-medium text-foreground">
                      Inquiry Topic <span className="text-primary">*</span>
                    </label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      required
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select a topic</option>
                      <option value="Full-Stack Web Development Track">Full-Stack Web Development Track</option>
                      <option value="Cloud, DevOps & Backend Track">Cloud, DevOps & Backend Track</option>
                      <option value="Data Engineering & AI Track">Data Engineering & AI Track</option>
                      <option value="UI/UX & Product Design Track">UI/UX & Product Design Track</option>
                      <option value="Course enrollment & tuition questions">Course enrollment & tuition questions</option>
                      <option value="Corporate or cohort training inquiry">Corporate or cohort training inquiry</option>
                    </select>
                    {errors.subject ? (
                      <p id="subject-error" className="text-xs text-destructive">
                        {errors.subject}
                      </p>
                    ) : null}
                  </div>

                  <FormTextareaField
                    id="message"
                    label="Message"
                    placeholder="Describe your background, questions, or intended timeline..."
                    value={formData.message}
                    onChange={(value) => updateField("message", value)}
                    error={errors.message}
                    required
                  />

                  <Button
                    type="submit"
                    size="lg"
                    variant="cta"
                    className="h-11 w-full font-semibold transition-all duration-200"
                    disabled={submitting}
                  >
                    {submitting ? "Sending..." : "Submit Inquiry"}
                  </Button>

                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"
                      aria-live="polite"
                    >
                      <CircleCheckBig className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Inquiry submitted successfully. Our technical advisors will reach out shortly.
                    </motion.div>
                  ) : null}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </SectionShell>

      <SectionShell className="py-14">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
            <iframe
              title={`${academyName} Location Map`}
              src="https://www.google.com/maps?q=14+Garden+Avenue,+GRA,+Enugu,+Enugu+State,+Nigeria&output=embed"
              className="h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
          <motion.div variants={fadeUp} className="space-y-4 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-soft flex flex-col justify-center">
            <h3 className="text-2xl font-semibold">Enugu Main Learning Centre</h3>
            <p className="text-muted-foreground text-sm">
              14 Garden Avenue, GRA, Enugu, Enugu State, Nigeria.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                100% Guaranteed Dual-Source Power (Generator + Solar Backup)
              </p>
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Enterprise High-Speed Fibre Internet Wi-Fi
              </p>
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lab 1 (Turing Room) &amp; Lab 2 (Lovelace Room) Workstations
              </p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
              <Clock3 className="h-4 w-4 text-accent" />
              Monday &ndash; Saturday: 9:00 AM to 6:00 PM
            </p>
            <div className="pt-2">
              <Button variant="outline" asChild>
                <a
                  href="https://maps.google.com/?q=14+Garden+Avenue,+GRA,+Enugu,+Enugu+State,+Nigeria"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get Directions
                </a>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </SectionShell>

      <SectionShell variant="immersive" className="py-12 bg-muted/20">
        <motion.div variants={sectionStagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="overflow-hidden">
            <motion.h2 variants={maskReveal} className="text-3xl font-bold tracking-tight md:text-4xl">
              Your software career starts with a conversation.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">
            Talk with our curriculum advisors to choose the training track that matches your ambitions.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="cta" asChild>
              <Link href="/courses">Explore All Courses</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/faq">Review Common Questions</Link>
            </Button>
          </motion.div>
        </motion.div>
      </SectionShell>
    </div>
  )
}
