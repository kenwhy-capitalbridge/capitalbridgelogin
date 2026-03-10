"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PLAN_CONFIG, type BillplzPlanId } from "@/lib/billplz";

const PLAN_LABELS: Record<BillplzPlanId, { name: string; price: string }> = {
  trial: { name: "RM1 Trial", price: "RM1" },
  monthly: { name: "Monthly Access", price: "RM200" },
  advisor: { name: "Quarterly Access", price: "RM540" },
  enterprise: { name: "Strategic Access", price: "RM2,500" },
};

const VALID_PLANS: BillplzPlanId[] = ["trial", "monthly", "advisor", "enterprise"];

export default function ConfirmPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<BillplzPlanId | null>(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const planParam = (searchParams.get("plan") ?? "").toLowerCase().trim() as BillplzPlanId;
      if (VALID_PLANS.includes(planParam)) {
        setPlan(planParam);
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/pricing");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("pending_plan")
        .eq("id", session.user.id)
        .maybeSingle();
      const p = (profile?.pending_plan ?? "").toLowerCase().trim() as BillplzPlanId;
      if (VALID_PLANS.includes(p)) {
        setPlan(p);
      } else {
        router.replace("/pricing");
      }
      setLoading(false);
    })();
  }, [searchParams, router]);

  async function handleContinueToPayment() {
    if (!plan) return;
    setError(null);
    setPayLoading(true);
    try {
      const res = await fetch("/api/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to create payment link.");
        setPayLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Invalid response from server.");
    } catch {
      setError("Network error. Please try again.");
    }
    setPayLoading(false);
  }

  if (loading || !plan) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card max-w-md text-center">
          <h1 className="cb-card-title">Capital Bridge</h1>
          <p className="mt-4 text-cb-green/80">Loading…</p>
        </div>
      </main>
    );
  }

  const config = PLAN_CONFIG[plan];
  const label = PLAN_LABELS[plan];
  const durationDays = config.days;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card max-w-md text-center">
        <h1 className="cb-card-title">Confirm Your Plan</h1>
        <p className="cb-card-subtitle mt-2">
          Your account has been created. Complete payment to activate access.
        </p>

        <div className="mt-6 rounded-xl border border-cb-gold/30 bg-cb-cream/5 p-5 text-left">
          <p className="font-semibold text-cb-green">{label.name}</p>
          <p className="mt-1 text-2xl font-semibold text-cb-gold">{label.price}</p>
          <p className="mt-1 text-sm text-cb-green/80">
            {durationDays}-day access • Activated immediately after payment
          </p>
        </div>

        <p className="mt-4 text-sm text-cb-green/80">
          Payment is processed securely by Billplz. You will be redirected to complete payment.
        </p>

        {error && <p className="cb-message-error mt-4">{error}</p>}

        <button
          type="button"
          onClick={handleContinueToPayment}
          disabled={payLoading}
          className="cb-btn-primary mt-6 w-full disabled:opacity-60"
        >
          {payLoading ? "Redirecting to secure payment…" : "Continue to Secure Payment"}
        </button>

        <p className="mt-6 text-center text-sm text-cb-green/80">
          <Link href="/pricing" className="cb-link">Choose a different plan</Link>
        </p>
      </div>
    </main>
  );
}
