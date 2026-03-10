"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
      fetch("/api/auth/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "signup_success", metadata: {} }),
        credentials: "same-origin",
      }).catch(() => {});

      // Create RM 1 trial bill and redirect to Billplz. Account is already created above;
      // when payment succeeds, the webhook activates membership.
      try {
        const res = await fetch("/api/create-bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "trial" }),
        });
        const data = await res.json();
        if (res.ok && data?.url) {
          window.location.href = data.url;
          return;
        }
        setError(
          data?.error ?? "Could not start RM 1 payment. Please try again."
        );
        return;
      } catch {
        setError("Could not start RM 1 payment. Please try again.");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle">Create Your Account</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {success && (
            <p className="cb-message-success">
              Account created. Redirecting to complete RM 1 payment…
            </p>
          )}
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
              autoComplete="new-password"
              minLength={6}
              className="cb-input"
            />
          </div>
          <button type="submit" disabled={loading} className="cb-btn-primary mt-2">
            {loading ? "Redirecting to payment…" : "Pay and Create Account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-cb-green/80">
          Already have an account? <Link href="/login" className="cb-link">Log In</Link>
        </p>
        <p className="mt-2 text-center text-sm text-cb-green/80">
          <Link href="/pricing" className="cb-link">Back to pricing page</Link>
        </p>
      </div>
    </main>
  );
}
