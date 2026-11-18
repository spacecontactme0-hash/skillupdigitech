// Zod validation schemas
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const registerBaseSchema = z.object({
  registrationType: z.literal("online").default("online"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["student", "instructor", "admin", "finance"]).optional(),
  acceptTerms: z.boolean().refine((value) => value === true, {
    message: "Please accept the terms and privacy policy.",
  }),
})

export const studentRegisterSchema = registerBaseSchema
  .extend({
    phoneNumber: z.string().min(7, "Phone number is required"),
    whatsappNumber: z.string().optional().or(z.literal("")),
    programmeCode: z.enum(["CAREER_READINESS", "SKILL_ACQUISITION"]).optional().default("CAREER_READINESS"),
    pathwayCode: z.string().optional(),
    courseSlug: z.string().optional(),
    deliveryArrangement: z.enum(["online", "hybrid"]).optional().default("online"),
    byolAcknowledged: z.boolean().optional().default(false),
    studentCategory: z.enum(["adult", "minor"]).optional().default("adult"),
    dateOfBirth: z.string().optional(),
    schoolName: z.string().optional(),
    gradeLevel: z.string().optional(),
    guardianName: z.string().optional(),
    guardianEmail: z.string().optional().or(z.literal("")),
    guardianPhone: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (data.deliveryArrangement === "hybrid" && !data.byolAcknowledged) {
      return false
    }
    return true
  }, {
    message: "You must acknowledge the Bring Your Own Laptop (BYOL) requirement for hybrid learning.",
    path: ["byolAcknowledged"],
  })
  .refine((data) => {
    if (data.studentCategory === "minor") {
      return Boolean(data.guardianName?.trim() && data.guardianEmail?.trim())
    }
    return true
  }, {
    message: "Parent or guardian name and contact email are required for students under 18.",
    path: ["guardianName"],
  })

export const registerSchema = studentRegisterSchema

export const instructorRegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    phoneNumber: z.string().min(7, "Phone number is required"),
    professionalHeadline: z.string().min(5, "Professional headline is required"),
    specialties: z.string().min(2, "Provide at least one specialty"),
    yearsOfExperience: z.coerce.number().min(0).max(60),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "Please accept the terms and privacy policy.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export const coursePriceSchema = z.object({
  NGN: z.number().min(1, "NGN price must be at least 1"),
  USD: z.number().min(0, "USD price must be positive"),
  EUR: z.number().min(0, "EUR price must be positive"),
  GBP: z.number().min(0, "GBP price must be positive"),
})

const courseBaseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(2, "Category is required"),
  level: z.enum(["Beginner Courses", "Intermediate Courses", "Pro Courses"]),
  price: coursePriceSchema,
  thumbnail: z.string().optional(),
  overview: z.array(z.string().min(2)).optional(),
  instructorId: z.string().min(1, "Instructor is required"),
  published: z.boolean().optional(),
  approved: z.boolean().optional(),
  modules: z.array(z.any()).optional(),
  totalDuration: z.number().optional(),
  enrollmentCount: z.number().optional(),
  rating: z.number().optional(),
})

export const courseCreateSchema = courseBaseSchema.superRefine((data, ctx) => {
  if (!Object.values(data.price).some((value) => value > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one price must be greater than 0",
      path: ["price"],
    })
  }
})

export const courseUpdateSchema = courseBaseSchema.partial().superRefine((data, ctx) => {
  if (data.price && !Object.values(data.price).some((value) => value > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one price must be greater than 0",
      path: ["price"],
    })
  }
})

export const enrollmentCreateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
})

export const enrollmentProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  completedLessons: z.array(z.string()).optional(),
})

export const paymentInitializeSchema = z.object({
  userId: z.string().min(1),
  courseIds: z.array(z.string()).min(1),
  amount: z.number().min(1),
  email: z.string().email(),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]).optional(),
})

export const paymentRefundSchema = z.object({
  status: z.enum(["refunded"]),
  refundReason: z.string().min(3).optional(),
})

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export const otpResendSchema = z.object({
  email: z.string().email(),
})

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["admin", "finance"]),
  password: z.string().min(6),
})

export const categoryCreateSchema = z.object({
  name: z.string().min(2, "Category name is required"),
})

export const categoryUpdateSchema = z.object({
  name: z.string().min(2, "Category name is required"),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(6, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  instructorProfile: z
    .object({
      phoneNumber: z.string().min(7),
      professionalHeadline: z.string().min(5),
      specialties: z.array(z.string().min(1)).min(1),
      yearsOfExperience: z.number().min(0).max(60),
    })
    .optional(),
  status: z.enum(["active", "suspended"]).optional(),
})

export const adminSettingsSchema = z.object({
  siteName: z.string().min(2),
  siteDescription: z.string().min(10),
  contactEmail: z.string().email(),
  supportEmail: z.string().email(),
  emailNotifications: z.boolean(),
  courseApproval: z.boolean(),
  autoEnrollment: z.boolean(),
  certificateGeneration: z.boolean(),
  maintenanceMode: z.boolean(),
  homeIntroVideoUrl: z.string().trim().optional().default(""),
})

