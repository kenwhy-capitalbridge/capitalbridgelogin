import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const mergedOptions =
              process.env.NODE_ENV === "production"
                ? { ...options, domain: ".thecapitalbridge.com", secure: true }
                : options;
            cookieStore.set(name, value, mergedOptions);
          });
        } catch {
          // Ignored in Server Components / when cookies are read-only
        }
      },
    },
  });
}

export async function createAppServerClient() {
  return createClient();
}

