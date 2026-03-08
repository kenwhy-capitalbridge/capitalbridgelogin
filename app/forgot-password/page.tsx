"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      console.error("Supabase reset password error:", error);
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card">
          <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
          <p className="cb-card-subtitle">Check Your Email</p>
          <p className="cb-message-success mt-6 px-4 py-3">
            If an account exists for that email, we&apos;ve sent a password
            reset link. Please check your inbox and follow the link to set a new
            password.
          </p>
          <p className="mt-6 text-center text-sm text-cb-green/80">
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
        <p className="cb-card-subtitle">Enter Your Email To Receive A Password Reset Link</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
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
          <button type="submit" disabled={loading} className="cb-btn-primary mt-2">
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-cb-green/80">
          <Link href="/login" className="cb-link">Back To Login</Link>
        </p>
      </div>
    </main>
  );
}
