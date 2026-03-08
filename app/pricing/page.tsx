"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    id: "free_trial",
    name: "Free Trial",
    price: 0,
    duration: "24 hours",
    description:
      "Limited preview access to the Capital Bridge advisory platform.",
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
    duration: "30 days",
    description:
      "Full platform access including advisory dashboard and modelling tools.",
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
  {
    id: "advisor",
    name: "Advisor Package",
    price: 500,
    duration: "90 days",
    description:
      "Designed for advisors evaluating asset durability and income strategies.",
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
    duration: "365 days",
    description:
      "Long-term professional access to the full advisory platform.",
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

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-3xl font-semibold text-cb-cream text-center sm:text-4xl">
          Capital Bridge Advisory Platform
        </h1>
        <p className="mt-2 text-center text-cb-cream/80">
          Choose a plan to unlock full access
        </p>

        {error && (
          <div className="cb-message-error mx-auto mt-4 max-w-md text-center">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
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
              <h2 className="font-serif text-xl font-semibold text-cb-green">
                {plan.name}
              </h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-semibold text-cb-green">
                  RM{plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-cb-green/70">
                    / {plan.duration}
                  </span>
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
                    onClick={() => handlePay(plan.plan!)}
                    disabled={!!loadingPlan}
                    className="cb-btn-primary w-full disabled:opacity-60"
                  >
                    {loadingPlan === plan.plan ? "Redirecting…" : plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.ctaLink!}
                    className="cb-btn-primary block w-full text-center"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-cb-cream/70">
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
