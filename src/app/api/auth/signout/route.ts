import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true });

  // Clear all Supabase auth cookies to ensure clean state
  const cookieNames = [
    "sb-access-token",
    "sb-refresh-token",
  ];
  for (const name of cookieNames) {
    response.cookies.delete(name);
  }

  return response;
}
