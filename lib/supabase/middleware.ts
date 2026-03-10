import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

/** Path prefixes that require an active membership (platform tools). */
const PROTECTED_PREFIXES = ["/advisory-platform", "/portfolio", "/strategy"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

/**
 * Refreshes the auth session and enforces access control.
 * - Protected routes: require auth + a row in active_memberships; else redirect to login or pricing.
 * - Public routes: allow through.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  if (!isProtectedPath(pathname)) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("message", "session_expired");
    return NextResponse.redirect(loginUrl);
  }

  const { data: activeRow, error: membershipError } = await supabase
    .from("active_memberships")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !activeRow) {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  return response;
}
