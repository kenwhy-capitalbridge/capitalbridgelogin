"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logAuthEvent } from "@/lib/authLog";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "reset") {
      setSuccessMessage("Password reset successfully. Sign in with your new password.");
    } else if (message === "session_expired") {
      setSuccessMessage("Your session has expired. Please log in again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    logAuthEvent("login_attempt", { email: email?.slice(0, 3) + "***" });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      logAuthEvent("login_failure", { reason: error.message });
      console.error("Supabase login error:", error);
      setError(error.message);
      return;
    }
    logAuthEvent("login_success");
    const redirect = searchParams.get("redirect");
    const allowed = ["/select-plan", "/advisory-platform", "/dashboard", "/pricing"];
    if (redirect && allowed.includes(redirect)) {
      router.push(redirect);
      router.refresh();
      return;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && typeof window !== "undefined") {
      window.location.href = appUrl;
      return;
    }
    window.location.href = "https://thecapitalbridge.com/advisory-platform/";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle">Log In To Your Account</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {successMessage && <p className="cb-message-success">{successMessage}</p>}
          {error && <p className="cb-message-error">{error}</p>}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-cb-green">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="cb-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-cb-green">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="cb-input"
            />
            <p className="mt-2 text-right">
              <Link href="/forgot-password" className="cb-link text-sm">
                Forgot Password?
              </Link>
            </p>
          </div>
          <button type="submit" disabled={loading} className="cb-btn-primary mt-2">
            {loading ? "Signing In…" : "Login"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-cb-green/80">
          Don&apos;t have an account? <Link href="/signup" className="cb-link">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}
