import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { contactFormSchema } from "@/lib/validators";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Server-side validation
    const result = contactFormSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;

    // Use service role client to bypass RLS for rate limiting check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Rate limiting: check submissions from this IP in the last hour
    const ip = getClientIp(request);
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { count, error: countError } = await supabase
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Rate limit check failed:", countError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          error: `Too many submissions. Please try again in ${RATE_LIMIT_WINDOW_HOURS} hour.`,
        },
        { status: 429 }
      );
    }

    // Store submission in database
    const { error: insertError } = await supabase
      .from("contact_submissions")
      .insert({
        name,
        email,
        subject,
        message,
        ip_address: ip,
      });

    if (insertError) {
      console.error("Failed to save contact submission:", insertError);
      return NextResponse.json(
        { error: "Failed to submit your message" },
        { status: 500 }
      );
    }

    // Send email notification via SMTP (if configured)
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.CONTACT_EMAIL
    ) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Parcel Tracker" <${process.env.SMTP_USER}>`,
          to: process.env.CONTACT_EMAIL,
          replyTo: email,
          subject: `Contact Form: ${subject}`,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <hr />
            <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
          `,
        });
      } catch (emailError) {
        // Log but don't fail — the submission is already saved
        console.error("Failed to send email notification:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
