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

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Always create a Supabase client so auth cookies are refreshed and
  // written with the shared `.thecapitalbridge.com` domain when needed.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          const mergedOptions =
            process.env.NODE_ENV === "production"
              ? { ...options, domain: ".thecapitalbridge.com", secure: true }
              : options;
          response.cookies.set(name, value, mergedOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (!isProtectedPath(pathname)) {
    // For public routes we only refresh the session / cookies and allow through.
    return response;
  }

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
