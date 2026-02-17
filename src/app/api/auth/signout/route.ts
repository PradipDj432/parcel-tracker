import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Explicitly delete all Supabase auth cookies.
  // @supabase/ssr uses cookies named sb-<ref>-auth-token (possibly chunked .0, .1, etc.)
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const response = NextResponse.json({ success: true });

  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }

  return response;
}
