import type { TrainingLocation } from "@/lib/types"

export const ONSITE_TRAINING = {
  formTitle: "Become a World-Class Certified Caregiver in 21 Days",
  formDescription:
    "Join SkillUp.",
  locations: {
    enugu: {
      label: "Enugu",
      startsOn: "March 9, 2026",
    },
    abuja: {
      label: "Abuja",
      startsOn: "March 23, 2026",
    },
  },
  durationDays: 21,
  hours: 150,
  registrationFeeNgn: 150000,
  paymentLink:
    process.env.NEXT_PUBLIC_ONSITE_TRAINING_PAYMENT_URL ||
    "/contact?subject=Onsite%20Training%20Payment%20Link",
  paymentProviderHint: "Paystack or Flutterwave",
  supportPhone: "09030910091",
} as const

export const ONLINE_TRAINING = {
  formTitle: "Online Student Registration",
  formDescription: "Register for online training. Courses are paid individually.",
} as const

export function getTrainingLocationLabel(location: TrainingLocation): string {
  return ONSITE_TRAINING.locations[location].label
}

export function getTrainingLocationStartDate(location: TrainingLocation): string {
  return ONSITE_TRAINING.locations[location].startsOn
}
