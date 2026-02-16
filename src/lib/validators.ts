import { z } from "zod/v4";

export const trackingNumberSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  courier: z.string().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

export const csvRowSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().optional(),
  label: z.string().optional(),
});
