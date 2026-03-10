"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdvisoryPlatformPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "preview" | "authenticated" | "no_subscription">("loading");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus("preview");
        return;
      }

      const { data: activeRow, error: membershipError } = await supabase
        .from("active_memberships")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (membershipError || !activeRow) {
        setStatus("no_subscription");
        return;
      }
      setStatus("authenticated");
    })();
  }, []);

  useEffect(() => {
    if (status === "no_subscription") {
      router.replace("/pricing");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card max-w-md text-center">
          <h1 className="cb-card-title">Capital Bridge</h1>
          <p className="mt-4 text-cb-green/80">Loading advisory platform…</p>
        </div>
      </main>
    );
  }

  if (status === "preview") {
    return (
      <main className="min-h-screen bg-[#0D3A1D] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-2xl font-semibold text-cb-cream sm:text-3xl">
            Advisory Platform
          </h1>
          <p className="mt-2 text-cb-cream/80">
            Preview: Income Assessment and capital engineering tools.
          </p>
          <div className="mt-8 rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-6">
            <h2 className="font-serif text-lg font-semibold text-cb-gold">
              Income Assessment
            </h2>
            <p className="mt-2 text-sm text-cb-cream/80">
              Evaluates whether your income structure can remain sustainable
              indefinitely without eroding capital. Unlock the full platform to
              run your own scenarios and stress-test resilience.
            </p>
          </div>
          <div className="mt-6 rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-6">
            <h2 className="font-serif text-lg font-semibold text-cb-gold">
              Unlock the platform
            </h2>
            <p className="mt-2 text-sm text-cb-cream/80">
              Sign in and choose a plan to access the full advisory tools.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/login?redirect=/pricing"
                className="cb-btn-primary inline-block text-center"
              >
                Start RM 1 Trial
              </Link>
              <Link
                href="/login?redirect=/pricing"
                className="cb-link rounded-xl border border-cb-gold/50 bg-cb-gold/10 px-4 py-3 text-center"
              >
                Subscribe RM 200 per month
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (status === "no_subscription") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0D3A1D] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-2xl font-semibold text-cb-cream sm:text-3xl">
          Advisory Platform
        </h1>
        <p className="mt-2 text-cb-cream/80">
          Income Assessment, Capital Engineering, and Stress Test Resilience tools.
        </p>
        <div className="mt-8 rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-6">
          <p className="text-cb-cream/90">
            Platform tools and calculations are loaded here. Server-side APIs will
            enforce subscription checks for advisory calculations, capital stress
            simulations, Monte Carlo analysis, and PDF report generation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="cb-link rounded-xl px-4 py-2">
              Dashboard
            </Link>
            <Link href="/pricing" className="cb-link rounded-xl px-4 py-2">
              Manage plan
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
