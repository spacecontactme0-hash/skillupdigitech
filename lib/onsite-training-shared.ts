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
  formTitle: "Become a World-Class Certified Caregiver in 21 Days",
  formDescription: "Join SkillUp.",
  durationDays: 21,
  hours: 150,
  registrationFeeNgn: 150000,
  paymentProviderHint: "Paystack or Flutterwave",
  supportPhone: "09030910091",
  benefits: [
    "Internationally recognized certification",
    "Training scrubs and practical materials",
    "Transcript and recommendation letter",
    "Internship and career support",
    "CPR and First Aid certification",
  ],
  testimonials: [
    {
      name: "Ada N.",
      role: "Caregiver Trainee",
      quote: "The practical sessions made me job-ready faster than any online-only course I had tried before.",
    },
    {
      name: "Michael O.",
      role: "Health Support Worker",
      quote: "I joined for the certificate, but the internship support and coaching were the real difference makers.",
    },
    {
      name: "Favour E.",
      role: "Student Nurse",
      quote: "The trainers were hands-on, the pace was intense, and I left with real confidence in patient care tasks.",
    },
  ],
  locations: {
    enugu: {
      label: "Enugu",
      startsOn: "March 9, 2026",
      venue: "Prompt Care Academy Enugu Campus",
      slotsLeft: 18,
      enrolledCount: 124,
    },
    abuja: {
      label: "Abuja",
      startsOn: "March 23, 2026",
      venue: "Prompt Care Academy Abuja Centre",
      slotsLeft: 11,
      enrolledCount: 136,
    },
  },
}
