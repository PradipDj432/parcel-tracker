import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Track all cookies that Supabase sets during token refresh
  // so we can copy them to redirect responses
  const refreshedCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Save cookies for potential redirect responses
          refreshedCookies.length = 0;
          refreshedCookies.push(...cookiesToSet);

          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token — this also refreshes expired JWTs
  // and writes updated cookies to the response via setAll callback
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper: create a redirect response that carries the refreshed auth cookies
  const redirectWith = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    // Copy refreshed auth cookies so the browser gets the new tokens
    for (const { name, value, options } of refreshedCookies) {
      redirectResponse.cookies.set(name, value, options);
    }
    return redirectResponse;
  };

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = ["/dashboard", "/history", "/import", "/admin", "/profile"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    return redirectWith("/login");
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/login", "/signup"];
  const isAuthPage = authPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isAuthPage && user) {
    return redirectWith("/dashboard");
  }

  return supabaseResponse;
}
