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
    if (!mounted) return;
    if (paid) {
      const t = setTimeout(() => {
        window.location.href = "https://platform.thecapitalbridge.com";
      }, 2000);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        router.replace("/pricing?message=payment_unsuccessful");
      }, 2000);
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
              <a
                href="https://platform.thecapitalbridge.com"
                className="cb-btn-primary inline-block text-center"
              >
                Go To Advisory Platform
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="cb-message-error mt-6">
              Payment was not completed. You can try again or choose another plan.
            </p>
            <p className="mt-3 text-sm text-cb-green/80">
              Redirecting you to the pricing page…
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/pricing" className="cb-btn-primary inline-block text-center">
                View Plans &amp; Retry
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
