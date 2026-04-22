import { z } from "zod/v4";

export const trackRequestSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  courierCode: z.string().min(1, "Courier code is required"),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

export const csvRowSchema = z.object({
  trackingNumber: z.string().min(1),
  courierCode: z.string().min(1),
  label: z.string().optional(),
});
