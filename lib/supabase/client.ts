import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

/** True when real Supabase env vars are set (not placeholder). */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";

/**
 * Browser Supabase client for Client Components.
 * Uses cookies for session storage (via @supabase/ssr) when used with middleware.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

const browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
export const supabase = browserClient;
