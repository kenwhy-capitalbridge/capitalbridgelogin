"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logAuthEvent } from "@/lib/authLog";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
        return;
      }
      if (typeof window === "undefined") return;
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const queryParams = new URLSearchParams(window.location.search);
      const type = hashParams.get("type") || queryParams.get("type");
      const tokenHash = queryParams.get("token_hash") || hashParams.get("token_hash");
      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!error) setReady(true);
        else setError("Invalid or expired reset link. Please request a new one.");
        return;
      }
      if (hashParams.get("type") === "recovery" && hashParams.get("access_token")) {
        setReady(true);
        return;
      }
      setError("Invalid or expired reset link. Please request a new one.");
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      console.error("Supabase update password error:", error);
      setError(error.message);
      return;
    }
    logAuthEvent("password_reset_success");
    logAuthEvent("password_change");
    await supabase.auth.signOut();
    router.push("/login?message=reset");
    router.refresh();
  }

  if (!ready && !error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card">
          <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
          <p className="mt-6 text-center text-cb-green/80">Verifying Reset Link…</p>
        </div>
      </main>
    );
  }

  if (error && !ready) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card">
          <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
          <p className="cb-message-error mt-6">{error}</p>
          <p className="mt-6 text-center text-sm text-cb-green/80">
            <Link href="/forgot-password" className="cb-link">Request A New Reset Link</Link>
          </p>
          <p className="mt-2 text-center text-sm text-cb-green/80">
            <Link href="/login" className="cb-link">Back To Login</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle">Set A New Password</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {error && <p className="cb-message-error">{error}</p>}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-cb-green">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="cb-input"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-cb-green">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="cb-input"
            />
          </div>
          <button type="submit" disabled={loading} className="cb-btn-primary mt-2">
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-cb-green/80">
          <Link href="/login" className="cb-link">Back To Login</Link>
        </p>
      </div>
    </main>
  );
}
