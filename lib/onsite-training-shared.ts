import { z } from "zod"

export const onsiteTrainingConfigSchema = z.object({
  formTitle: z.string().min(5),
  formDescription: z.string().min(10),
  durationDays: z.coerce.number().min(1),
  hours: z.coerce.number().min(1),
  registrationFeeNgn: z.coerce.number().min(1),
  paymentProviderHint: z.string().min(2),
  supportPhone: z.string().min(5),
  benefits: z.array(z.string().min(2)).min(1),
  testimonials: z.array(
    z.object({
      name: z.string().min(2),
      role: z.string().min(2),
      quote: z.string().min(10),
    }),
  ).min(1),
  locations: z.object({
    enugu: z.object({
      label: z.string().min(2),
      startsOn: z.string().min(3),
      venue: z.string().min(2),
      slotsLeft: z.coerce.number().min(0),
      enrolledCount: z.coerce.number().min(0),
    }),
    abuja: z.object({
      label: z.string().min(2),
      startsOn: z.string().min(3),
      venue: z.string().min(2),
      slotsLeft: z.coerce.number().min(0),
      enrolledCount: z.coerce.number().min(0),
    }),
  }),
})

export type OnsiteTrainingConfig = z.infer<typeof onsiteTrainingConfigSchema>

export const DEFAULT_ONSITE_TRAINING_CONFIG: OnsiteTrainingConfig = {
  formTitle: "Master In-Demand Technology Engineering in Our Physical Labs",
  formDescription:
    "Hands-on Saturday coding workshops, high-speed fibre broadband, uninterrupted generator power, and direct mentor code reviews at our Enugu Learning Centre.",
  durationDays: 180,
  hours: 240,
  registrationFeeNgn: 120000,
  paymentProviderHint: "Paystack or Verified Bank Transfer",
  supportPhone: "09030910091",
  benefits: [
    "Dedicated lab desk with continuous generator and solar electricity",
    "High-speed enterprise fibre internet for coding labs and cloud deployments",
    "1-on-1 weekly code reviews and architecture debugging with senior engineers",
    "Bring Your Own Laptop (BYOL) hands-on software development setup",
    "Verified Capstone project portfolio and graduation certification",
  ],
  testimonials: [
    {
      name: "Emeka O.",
      role: "Junior Software Engineer",
      quote:
        "The physical Saturday labs at the Enugu Centre allowed me to debug complex Next.js and PostgreSQL issues directly with instructors. Landing my first software role was smooth.",
    },
    {
      name: "Chisom K.",
      role: "AI Solutions Developer",
      quote:
        "Having guaranteed electricity and fast fibre internet every Saturday made all the difference in training and fine-tuning local models.",
    },
    {
      name: "Obinna E.",
      role: "Growth & Performance Marketer",
      quote:
        "Hands-on video editing and ad analytics workshops took my agency portfolio from amateur to high-paying client retainers.",
    },
  ],
  locations: {
    enugu: {
      label: "Enugu Main Learning Centre",
      startsOn: "March 7, 2026",
      venue: "14 Garden Avenue, GRA, Enugu State",
      slotsLeft: 12,
      enrolledCount: 48,
    },
    abuja: {
      label: "Abuja Innovation Hub (Coming Q3)",
      startsOn: "August 1, 2026",
      venue: "Central Business District, Abuja",
      slotsLeft: 30,
      enrolledCount: 10,
    },
  },
}
