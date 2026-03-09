"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const paid =
    searchParams.get("paid") === "true" ||
    searchParams.get("billplz[paid]") === "true";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && paid) {
      const t = setTimeout(() => {
        router.replace("/advisory-platform");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [mounted, paid, router]);

  if (!mounted) {
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
      <div className="cb-card max-w-md text-center">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        {paid ? (
          <>
            <p className="cb-message-success mt-6">
              Your payment was successful. Your membership has been activated.
            </p>
            <p className="mt-3 text-sm text-cb-green/80">
              Redirecting you to the Advisory Platform…
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/advisory-platform" className="cb-btn-primary inline-block text-center">
                Go To Advisory Platform
              </Link>
              <Link href="/dashboard" className="cb-link rounded-xl px-4 py-3 text-center">
                Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-6 text-cb-green/80">
              You have been redirected from the payment page.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/dashboard" className="cb-btn-primary inline-block text-center">
                Dashboard
              </Link>
              <Link href="/pricing" className="cb-link rounded-xl px-4 py-3 text-center">
                View Plans
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="cb-card max-w-md text-center">
            <h1 className="cb-card-title">Capital Bridge</h1>
            <p className="mt-4 text-cb-green/80">Loading…</p>
          </div>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
