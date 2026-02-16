import { z } from "zod/v4";

export const trackingNumberSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  courier: z.string().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const csvRowSchema = z.object({
  trackingNumber: z.string().min(1),
  courier: z.string().optional(),
  label: z.string().optional(),
});
