"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SelectPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?redirect=/select-plan");
        return;
      }
      setCheckingAuth(false);
    })();
  }, [router]);

  async function handleFreeTrial() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/activate-free-trial", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      setError(data?.error ?? "Could not activate free trial.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMonthly() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? "Could not start payment.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card max-w-md text-center">
          <h1 className="cb-card-title">Capital Bridge</h1>
          <p className="mt-4 text-cb-green/80">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card max-w-lg">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle mt-1">
          Access to the advisory platform requires an active plan.
        </p>
        <p className="mt-4 text-sm text-cb-green/80">
          Choose an option below to unlock the Capital Stress Model, Forever Income
          Model, and advisory report tools.
        </p>

        {error && (
          <div className="cb-message-error mt-4">{error}</div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-cb-green/20 bg-white/60 p-5">
            <h2 className="font-serif text-lg font-semibold text-cb-green">
              Free Trial
            </h2>
            <p className="mt-2 text-sm text-cb-green/80">
              7-day access to the full advisory platform.
            </p>
            <button
              type="button"
              onClick={handleFreeTrial}
              disabled={loading}
              className="cb-btn-primary mt-4 w-full disabled:opacity-60"
            >
              {loading ? "Activating…" : "Start Free Trial"}
            </button>
          </div>
          <div className="rounded-xl border border-cb-green/20 bg-white/60 p-5">
            <h2 className="font-serif text-lg font-semibold text-cb-green">
              RM200 Monthly Access
            </h2>
            <p className="mt-2 text-sm text-cb-green/80">
              30-day access. Full platform and report generation.
            </p>
            <button
              type="button"
              onClick={handleMonthly}
              disabled={loading}
              className="cb-btn-primary mt-4 w-full disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Subscribe RM200 per month"}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-cb-green/80">
          <Link href="/advisory-platform" className="cb-link">
            Back to Advisory Platform
          </Link>
          {" · "}
          <Link href="/dashboard" className="cb-link">
            Dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
