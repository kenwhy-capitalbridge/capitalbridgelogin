"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const OUTCOME_PREVIEW_BOXES = [
  {
    id: "capital-runway",
    title: "Capital Runway",
    description:
      "Projects your capital balance over time under fixed monthly withdrawals. Explore reduce income, add capital, or higher return scenarios with the outcome optimiser and optional inflation adjustment.",
    image: "/outcome-preview/capital_runway.png",
  },
  {
    id: "capital-durability",
    title: "Capital Durability",
    description:
      "Shows how your capital may evolve over time under market conditions and withdrawals, with a median path and range to reflect uncertainty in outcomes.",
    image: "/outcome-preview/capital_durability.png",
  },
  {
    id: "capital-stress-test",
    title: "Capital Stress-Test",
    description:
      "Shows how your capital structure responds when key assumptions deteriorate — from market returns and withdrawals to inflation — with depletion pressure and ending capital for each scenario.",
    image: "/outcome-preview/capital_stress_test.png",
  },
  {
    id: "unlocking-capital",
    title: "UNLOCKING CAPITAL",
    description:
      "Turn assets you own into reinvestable income. Explore property refinance, short-term loans, borrowing against investments, and securities-backed lending with configurable parameters and estimated investment returns.",
    image: "/outcome-preview/unlocking_capital.png",
  },
  {
    id: "capital-health-score",
    title: "Capital Health Score",
    description:
      "A single metric for your capital strength plus a risk overview: risk level, income gap, capital runway, expected returns, and capital survival age — so you see where you stand at a glance.",
    image: "/outcome-preview/capital_health_score.png",
  },
  {
    id: "advisory-summary",
    title: "Advisory Summary",
    description:
      "The Lion's Verdict: a clear advisory based on your withdrawal rate, expected returns, and capital runway — with a capital runway metric and concrete recommendations to reinforce your structure before strain.",
    image: "/outcome-preview/advisory_summary.png",
  },
];

const FEATURE_MICROCOPY: Record<string, string> = {
  "Save report on server":
    "Your plans stay saved, so you can come back as situation changes and see how changes affect your outcome — instantly.",
  "Save reports on server":
    "Your plans stay saved, so you can come back as situation changes and see how changes affect your outcome — instantly.",
};

const INDIVIDUAL_PLANS = [
  {
    id: "trial",
    name: "Trial Access (7 days)",
    price: 1,
    durationLabel: "7 Day Access",
    description:
      "Try the advisory dashboard and models before committing.",
    includes: [
      "Full advisory dashboard",
      "Forever Income Model",
      "Capital Engineering",
      "Income Engineering Model",
      "Income Assessment",
      "Stress Test Income & Capital Resilience",
      "Key Takeaways",
      "Generate PDF Analysis & Report",
    ],
    unavailableInIncludes: ["Stress Test Income & Capital Resilience"],
    excludes: [
      "The Lion’s Verdict",
      "Save report on server",
    ],
    cta: "Start RM 1 Trial",
    ctaLink: "/signup",
    paid: false,
    recommended: false,
  },
  {
    id: "monthly",
    name: "Monthly Access (30 days)",
    price: 200,
    durationLabel: "30 Day Access",
    description:
      "Flexible month-to-month access to the advisory platform.",
    includes: [
      "Full advisory dashboard",
      "Forever Income Model",
      "Capital Engineering",
      "Income Engineering Model",
      "Income Assessment",
      "Stress Test Income & Capital Resilience",
      "Key Takeaways",
      "Generate PDF Analysis & Report",
      "The Lion’s Verdict",
      "Save reports on server",
    ],
    excludes: [],
    cta: "Get Monthly Access",
    plan: "monthly",
    paid: true,
    recommended: false,
  },
];

const ADVISOR_PLANS = [
  {
    id: "quarterly",
    name: "Quarterly Access (90 days)",
    price: 540,
    durationLabel: "90 Day Access",
    description:
      "Ideal balance between flexibility and commitment.",
    includes: [
      "Full advisory dashboard",
      "Forever Income Model",
      "Capital Engineering",
      "Income Engineering Model",
      "Income Assessment",
      "Stress Test Income & Capital Resilience",
      "Key Takeaways",
      "Generate PDF Analysis & Report",
      "The Lion’s Verdict",
      "Save reports on server",
    ],
    excludes: [],
    cta: "Choose Quarterly Plan",
    plan: "advisor",
    paid: true,
    recommended: true,
    badgeLabel: "Most Popular",
    identityLine: "Best suited for structured financial planning cycles.",
  },
  {
    id: "yearly_full",
    name: "Strategic Advisory & Execution",
    price: 2400,
    durationLabel: "365 Day Strategic Access",
    description:
      "Full-year strategic advisory access for entrepreneurs, investors, and families structuring sustainable lifetime income portfolios.",
    identityLine: "For long-term capital structuring and income strategy.",
    includes: [
      "Full advisory dashboard",
      "Forever Income Model",
      "Capital Engineering",
      "Income Engineering Model",
      "Income Assessment",
      "Stress Test Income & Capital Resilience",
      "Key Takeaways",
      "Generate PDF Analysis & Report",
      "The Lion’s Verdict",
      "Save reports on server",
      "STRATEGIC ADVANTAGES",
      "Enjoy partner financing and leverage opportunities",
      "Access curated investment opportunities",
      "Structured monthly income distribution & execution",
    ],
    excludes: [],
    cta: "Apply for Strategic Access",
    plan: "enterprise",
    paid: true,
    recommended: false,
    badgeLabel: "Strategic Tier",
    includesNoCheck: ["STRATEGIC ADVANTAGES"],
    includesPlusIcon: [
      "Enjoy partner financing and leverage opportunities",
      "Access curated investment opportunities",
      "Structured monthly income distribution & execution",
    ],
  },
];

function PlanCard({
  plan,
  onPay,
  loadingPlan,
}: {
  plan: (typeof INDIVIDUAL_PLANS)[0] | (typeof ADVISOR_PLANS)[0];
  onPay: (planId: string) => void;
  loadingPlan: string | null;
}) {
  const planExt = plan as { badgeLabel?: string; supportingLine?: string; identityLine?: string; unavailableInIncludes?: string[]; includesNoCheck?: string[]; includesPlusIcon?: string[] };
  const showBadge = plan.recommended || !!planExt.badgeLabel;
  const badgeText = planExt.badgeLabel ?? (plan.recommended ? "Recommended" : "");
  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-cb-cream p-6 shadow-lg ${
        plan.recommended || !!planExt.badgeLabel
          ? "ring-2 ring-cb-gold ring-offset-2 ring-offset-[#0D3A1D]"
          : ""
      }`}
    >
      {showBadge && badgeText && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cb-gold px-3 py-0.5 text-xs font-medium text-cb-green">
          {badgeText}
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-cb-green">{plan.name}</h3>
      {planExt.identityLine && (
        <p className="mt-1 text-sm text-cb-green/70">{planExt.identityLine}</p>
      )}
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-semibold text-cb-green">
          RM {plan.price.toLocaleString()}
        </span>
        {plan.price > 0 && (
          <span className="text-sm text-cb-green/70">{plan.durationLabel}</span>
        )}
        {plan.price === 0 && (
          <span className="text-sm text-cb-green/70">{plan.durationLabel}</span>
        )}
      </div>
      {planExt.supportingLine && (
        <p className="mt-1 text-sm text-cb-green/70">{planExt.supportingLine}</p>
      )}
      <p className="mt-3 text-sm text-cb-green/80">{plan.description}</p>
      <div className="mt-4 flex-1 space-y-2 text-sm text-cb-green">
        <ul className="space-y-2">
          {plan.includes.map((f) => {
            const unavailable = planExt.unavailableInIncludes?.includes(f);
            const noCheck = planExt.includesNoCheck?.includes(f);
            const plusIcon = planExt.includesPlusIcon?.includes(f);
            const microcopy = FEATURE_MICROCOPY[f];
            return (
              <li key={f} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {!noCheck && (
                    <span className={
                      plusIcon ? "text-xl font-bold text-cb-gold" :
                      unavailable ? "text-red-500" : "text-cb-gold"
                    }>{plusIcon ? "+" : unavailable ? "✕" : "✓"}</span>
                  )}
                  <span className={unavailable ? "text-cb-green/70" : noCheck ? "font-semibold text-cb-green" : undefined}>{f}</span>
                </div>
                {microcopy && <p className="text-xs text-cb-green/70 pl-6">{microcopy}</p>}
              </li>
            );
          })}
        </ul>
        {plan.excludes && plan.excludes.length > 0 && (
          <ul className="mt-3 space-y-1 text-cb-green/70">
            {plan.excludes.map((f) => {
              const microcopy = FEATURE_MICROCOPY[f];
              return (
                <li key={f} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    {f}
                  </div>
                  {microcopy && <p className="text-xs text-cb-green/70 pl-6">{microcopy}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-6">
        {plan.paid ? (
          <button
            type="button"
            onClick={() => onPay(plan.plan!)}
            disabled={!!loadingPlan}
            className="cb-btn-primary w-full disabled:opacity-60"
          >
            {loadingPlan === plan.plan ? "Redirecting…" : plan.cta}
          </button>
        ) : (
          <Link
            href={("ctaLink" in plan ? plan.ctaLink : null) ?? "/signup"}
            className="cb-btn-primary block w-full text-center"
          >
            {plan.cta}
          </Link>
        )}
      </div>
    </div>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recentlyExpired = searchParams.get("message") === "recently_expired";

  async function handlePay(planId: string) {
    if (!planId) return;
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/signup?redirect=/pricing");
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to create payment link.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Invalid response from server.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D3A1D] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        {/* Value Anchor Section */}
        <section className="text-center">
          <h1 className="font-serif text-3xl font-semibold text-cb-gold sm:text-4xl lg:text-5xl">
            The Capital Bridge Advisory Framework
          </h1>
          <div className="mx-auto mt-4 max-w-2xl text-lg text-cb-cream/85">
            <p className="font-semibold text-cb-cream">
              A clear path to growing capital and building income that lasts for life
            </p>
            <p className="mt-2">
              Capital Bridge helps you understand where you stand today, grow your
              capital with intent, and turn it into sustainable income — using a simple,
              step‑by‑step advisory framework.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-4">
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-6 py-5 text-left">
              <h3 className="font-serif text-lg font-semibold text-cb-gold">
                Income Assessment
              </h3>
              <p className="mt-2 text-sm text-cb-cream/80">
                Evaluates whether your income structure can remain sustainable
                indefinitely without eroding capital.
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center justify-center py-1 sm:py-0" aria-hidden>
              <svg
                className="h-8 w-8 text-cb-gold/90 sm:hidden"
                viewBox="0 0 24 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M6 14l6 8 6-8" />
              </svg>
              <svg
                className="hidden h-8 w-8 text-cb-gold/90 sm:block"
                viewBox="0 0 32 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12h20M14 4l8 8-8 8" />
              </svg>
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-6 py-5 text-left">
              <h3 className="font-serif text-lg font-semibold text-cb-gold">
                Capital Engineering
              </h3>
              <p className="mt-2 text-sm text-cb-cream/80">
                Analyzes how capital sources, withdrawals, and investment growth
                interact to support long-term income.
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center justify-center py-1 sm:py-0" aria-hidden>
              <svg
                className="h-8 w-8 text-cb-gold/90 sm:hidden"
                viewBox="0 0 24 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M6 14l6 8 6-8" />
              </svg>
              <svg
                className="hidden h-8 w-8 text-cb-gold/90 sm:block"
                viewBox="0 0 32 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12h20M14 4l8 8-8 8" />
              </svg>
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-6 py-5 text-left">
              <h3 className="font-serif text-lg font-semibold text-cb-gold">
                Stress Test Income & Capital Resilience
              </h3>
              <p className="mt-2 text-sm text-cb-cream/80">
                Tests how your capital structure behaves under market stress,
                volatility, or unexpected changes.
              </p>
            </div>
          </div>
        </section>

        {/* Outcome Preview Section — styled like THE LION'S VERDICT: dark green, gold accents */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-serif text-2xl font-semibold text-cb-cream sm:text-3xl">
            Capital Bridge Outcome Preview
          </h2>
          <p className="mt-2 text-cb-cream/80">
            Preview the advisory insights generated by Capital Bridge before building
            your own strategy.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OUTCOME_PREVIEW_BOXES.map((box) => (
              <div
                key={box.id}
                className="overflow-hidden rounded-xl border border-cb-gold/30 bg-[#1a2e1f] shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full bg-[#0D3A1D]">
                  <Image
                    src={box.image}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="border-t border-cb-gold/20 p-4">
                  <h3 className="font-serif text-base font-semibold text-cb-gold">
                    {box.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-cb-cream/80 leading-snug">
                    {box.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-cb-cream/60">
            Full advisory interpretation is available with platform access.
          </p>
          <div className="mt-8 rounded-xl border border-cb-gold/30 bg-cb-cream/5 p-5">
            <h3 className="font-serif text-lg font-semibold text-cb-cream">
              Run Your Own Capital Structure Analysis
            </h3>
            <p className="mt-2 text-sm text-cb-cream/80">
              See how long your capital can sustain withdrawals under different assumptions
              and market conditions.
            </p>
            <p className="mt-2 text-xs text-cb-cream/70">
              Most users discover important weaknesses in their capital structure within
              their first analysis.
            </p>
            <div className="mt-4">
              <Link
                href="/signup?trial=1"
                className="cb-btn-primary inline-block w-full text-center sm:w-auto"
              >
                Run My Analysis for RM 1
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Layer Section */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-serif text-2xl font-semibold text-cb-gold sm:text-3xl">
            A Proprietary Framework to Build Capital and Income for Life
          </h2>
          <p className="mt-3 max-w-2xl text-cb-cream/85">
            Capital Bridge helps you grow capital faster, stress‑test every strategy with full transparency, and turn strong results into sustainable income you can rely on for the long term.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-5 py-4">
              <span className="text-cb-gold" aria-hidden>◆</span>
              <div>
                <p className="font-medium text-cb-cream">Scenario-Based Stress Testing</p>
                <p className="mt-1 text-sm text-cb-cream/75">
                  Evaluate how assets perform under multiple withdrawal and stress
                  conditions.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-5 py-4">
              <span className="text-cb-gold" aria-hidden>◆</span>
              <div>
                <p className="font-medium text-cb-cream">
                  Long-Term Capital Durability Analysis
                </p>
                <p className="mt-1 text-sm text-cb-cream/75">
                  Assess how long portfolios can sustain income before depletion.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-5 py-4">
              <span className="text-cb-gold" aria-hidden>◆</span>
              <div>
                <p className="font-medium text-cb-cream">Structured Advisory Framework</p>
                <p className="mt-1 text-sm text-cb-cream/75">
                  Translate complex financial scenarios into clear insights that help you compare opportunities, grow capital faster, and make confident decisions.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-5 py-4">
              <span className="text-cb-gold" aria-hidden>◆</span>
              <div>
                <p className="font-medium text-cb-cream">Transparent Modelling Logic</p>
                <p className="mt-1 text-sm text-cb-cream/75">
                  Provide structured outputs that explain the reasoning behind advisory
                  conclusions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-serif text-2xl font-semibold text-cb-gold sm:text-3xl">
            Choose Your Plan
          </h2>
          <p className="mt-2 text-cb-cream/80">
            Test the platform with a low-cost trial, keep flexible monthly access, or step
            up to quarterly and strategic yearly tiers.
          </p>

          {recentlyExpired && (
            <div className="cb-message-error mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-900">
              Your access has recently expired. Renew now to continue using the Capital
              Bridge advisory platform.
            </div>
          )}
          {error && (
            <div className="cb-message-error mx-auto mt-4 max-w-md text-center">
              {error}
            </div>
          )}

          <div className="mt-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {INDIVIDUAL_PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onPay={handlePay}
                  loadingPlan={loadingPlan}
                />
              ))}
            </div>
          </div>

          <div className="mt-12">
            <div className="grid gap-6 sm:grid-cols-2">
              {ADVISOR_PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onPay={handlePay}
                  loadingPlan={loadingPlan}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Trusted Framework Section (below pricing) */}
        <section className="mt-10 sm:mt-12">
          <h3 className="font-serif text-xl font-semibold text-cb-cream">
            Trusted Financial Modelling Framework
          </h3>
          <div className="mt-3 space-y-1.5 text-sm text-cb-cream/80">
            <p>
              Structured advisory models used to evaluate income sustainability and capital
              durability.
            </p>
            <p>
              Designed for investors, professionals, and financial advisors making
              long-term income decisions.
            </p>
            <p>
              Transparent modelling logic so users understand how advisory conclusions are
              generated.
            </p>
          </div>
        </section>

        <p className="mt-12 text-center text-sm text-cb-cream/70">
          <Link href="/login" className="text-cb-gold hover:underline">
            Back To Login
          </Link>
          {" · "}
          <Link href="/" className="text-cb-gold hover:underline">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0D3A1D]">
          <p className="text-cb-cream/80">Loading…</p>
        </main>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
