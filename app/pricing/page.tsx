"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const INDIVIDUAL_PLANS = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    durationLabel: "24 Hour Access",
    description: "Limited preview access to the Capital Bridge advisory platform.",
    features: [
      "Full advisory dashboard",
      "Capital Stress Model",
      "Forever Income Model",
      "Scenario modelling tools",
      "Advisory report generation",
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup",
    paid: false,
    recommended: false,
  },
  {
    id: "monthly",
    name: "Monthly Access",
    price: 200,
    durationLabel: "30 Day Access",
    description: "Full platform access including advisory dashboard and modelling tools.",
    features: [
      "Full advisory dashboard",
      "Capital Stress Model",
      "Forever Income Model",
      "Scenario modelling tools",
      "Advisory report generation",
    ],
    cta: "Subscribe Monthly",
    plan: "monthly",
    paid: true,
    recommended: false,
  },
];

const ADVISOR_PLANS = [
  {
    id: "advisor",
    name: "Advisor Package",
    price: 500,
    durationLabel: "90 Day Access",
    description:
      "Designed for financial advisors modelling asset durability and income sustainability strategies for clients.",
    features: [
      "Full advisory dashboard",
      "Capital Stress Model",
      "Forever Income Model",
      "Scenario modelling tools",
      "Advisory report generation",
    ],
    cta: "Get Advisor Access",
    plan: "advisor",
    paid: true,
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1800,
    durationLabel: "365 Day Access",
    description:
      "Long-term professional access for advisory firms. Full platform for teams and institutional use.",
    features: [
      "Full advisory dashboard",
      "Capital Stress Model",
      "Forever Income Model",
      "Scenario modelling tools",
      "Advisory report generation",
    ],
    cta: "Enterprise Access",
    plan: "enterprise",
    paid: true,
    recommended: false,
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
  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-cb-cream p-6 shadow-lg ${
        plan.recommended
          ? "ring-2 ring-cb-gold ring-offset-2 ring-offset-[#0D3A1D]"
          : ""
      }`}
    >
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cb-gold px-3 py-0.5 text-xs font-medium text-cb-green">
          Recommended
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-cb-green">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-semibold text-cb-green">
          RM{plan.price}
        </span>
        {plan.price > 0 && (
          <span className="text-sm text-cb-green/70">{plan.durationLabel}</span>
        )}
        {plan.price === 0 && (
          <span className="text-sm text-cb-green/70">{plan.durationLabel}</span>
        )}
      </div>
      <p className="mt-3 text-sm text-cb-green/80">{plan.description}</p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-cb-green">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-cb-gold">✓</span>
            {f}
          </li>
        ))}
      </ul>
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
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recentlyExpired = searchParams.get("message") === "recently_expired";

  async function handlePay(planId: string) {
    if (!planId) return;
    setError(null);
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
          <h1 className="font-serif text-3xl font-semibold text-cb-cream sm:text-4xl lg:text-5xl">
            Institutional-Grade Advisory Tools for Building Sustainable Lifetime Income
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-cb-cream/85">
            Capital Bridge helps individuals and financial advisors evaluate asset
            durability, income sustainability, and long-term financial resilience using
            structured advisory models.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-6 py-5 text-left">
              <h3 className="font-serif text-lg font-semibold text-cb-gold">
                Capital Stress Model
              </h3>
              <p className="mt-2 text-sm text-cb-cream/80">
                Simulate how long assets can survive under different withdrawal
                scenarios.
              </p>
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-6 py-5 text-left">
              <h3 className="font-serif text-lg font-semibold text-cb-gold">
                Forever Income Model
              </h3>
              <p className="mt-2 text-sm text-cb-cream/80">
                Design sustainable lifetime income strategies from asset portfolios.
              </p>
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/5 px-6 py-5 text-left">
              <h3 className="font-serif text-lg font-semibold text-cb-gold">
                Advisory Report Generator
              </h3>
              <p className="mt-2 text-sm text-cb-cream/80">
                Generate structured advisory reports analysing capital durability and
                financial resilience.
              </p>
            </div>
          </div>
        </section>

        {/* Outcome Preview Section */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-serif text-2xl font-semibold text-cb-cream sm:text-3xl">
            Capital Bridge Outcome Preview
          </h2>
          <p className="mt-2 text-cb-cream/80">
            Preview the advisory insights generated by Capital Bridge before building
            your own strategy.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-5">
              <p className="text-sm font-medium text-cb-gold">Income Durability Curve</p>
              <p className="mt-1 text-xs text-cb-cream/70">
                A visual chart showing how long a portfolio can sustain withdrawals.
              </p>
              <div className="mt-3 h-20 rounded-lg bg-cb-cream/20" aria-hidden />
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-5">
              <p className="text-sm font-medium text-cb-gold">Capital Stress Timeline</p>
              <p className="mt-1 text-xs text-cb-cream/70">
                A timeline chart illustrating how capital evolves under stress scenarios.
              </p>
              <div className="mt-3 h-20 rounded-lg bg-cb-cream/20" aria-hidden />
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-5">
              <p className="text-sm font-medium text-cb-gold">Income Sustainability Score</p>
              <p className="mt-1 text-xs text-cb-cream/70">
                A summarized metric indicating the long-term reliability of an income
                strategy.
              </p>
              <div className="mt-3 h-12 w-24 rounded-lg bg-cb-cream/20" aria-hidden />
            </div>
            <div className="rounded-xl border border-cb-cream/20 bg-cb-cream/10 p-5">
              <p className="text-sm font-medium text-cb-gold">Advisory Summary Panel</p>
              <p className="mt-1 text-xs text-cb-cream/70">
                Structured advisory insight highlighting strengths and weaknesses of a
                financial strategy.
              </p>
              <div className="mt-3 h-16 rounded-lg bg-cb-cream/20" aria-hidden />
            </div>
          </div>
        </section>

        {/* Trust Layer Section */}
        <section className="mt-16 sm:mt-20">
          <h2 className="font-serif text-2xl font-semibold text-cb-cream sm:text-3xl">
            Structured Financial Modelling Designed for Long-Term Capital Resilience
          </h2>
          <p className="mt-3 max-w-2xl text-cb-cream/85">
            Capital Bridge applies structured financial modelling techniques to
            evaluate income sustainability, capital durability, and long-term financial
            resilience.
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
                  Translate complex financial scenarios into clear advisory insights.
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
          <h2 className="font-serif text-2xl font-semibold text-cb-cream sm:text-3xl">
            Choose Your Plan
          </h2>
          <p className="mt-2 text-cb-cream/80">
            Individual access for personal use, or advisor access for professionals.
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
            <h3 className="mb-4 font-serif text-lg font-semibold text-cb-gold">
              Individual Access Plans
            </h3>
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
            <h3 className="mb-4 font-serif text-lg font-semibold text-cb-gold">
              Advisor Access Plans
            </h3>
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
