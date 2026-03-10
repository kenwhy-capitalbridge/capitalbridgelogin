"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const VALID_PLANS = ["trial", "monthly", "advisor", "enterprise"] as const;
type PlanId = (typeof VALID_PLANS)[number];

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const planParam = (searchParams.get("plan") ?? "").toLowerCase().trim();
  const isValidPlan = VALID_PLANS.includes(planParam as PlanId);
  const plan: PlanId | null = isValidPlan ? (planParam as PlanId) : null;

  useEffect(() => {
    if (!isValidPlan) {
      router.replace("/pricing");
    }
  }, [isValidPlan, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (!plan) {
        setError("Please select a plan from the pricing page.");
        router.replace("/pricing");
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { selected_plan: plan },
        },
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

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (typeof window !== "undefined") {
        window.location.href = appUrl || "/dashboard";
      }
      return;
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
              Account created. Redirecting to confirm your plan…
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
            {loading ? "Creating account…" : "Create Account"}
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
