/**
 * Browser Supabase client for auth. Uses @supabase/ssr for cookie-based sessions.
 * Use this in Client Components. Middleware refreshes the session from cookies.
 */
export { supabase } from "@/lib/supabase/client";
