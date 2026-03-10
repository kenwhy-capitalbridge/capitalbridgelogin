"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logAuthEvent } from "@/lib/authLog";
import { useSessionTimeout } from "@/lib/useSessionTimeout";
import {
  formatRemainingAccess,
  getRemainingHours,
} from "@/lib/formatRemainingAccess";

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
};

type Membership = {
  status: string;
  expires_at: string;
  plan: string;
};

const SESSION_TIMEOUT_MINUTES = typeof process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES !== "undefined"
  ? Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES) || 30
  : 30;

const GRACE_PERIOD_HOURS = 24;
const RENEWAL_WARNING_HOURS = 3 * 24; // 3 days

function planDisplayName(plan: string): string {
  const names: Record<string, string> = {
    trial: "Trial (7 days)",
    free_trial: "Trial (7 days)",
    monthly: "Monthly Access",
    advisor: "Advisor Package",
    enterprise: "Enterprise",
  };
  return names[plan] ?? plan.replace(/_/g, " ");
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useSessionTimeout(SESSION_TIMEOUT_MINUTES);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, email")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }
      setProfile(
        profileData ?? {
          id: session.user.id,
          username: session.user.user_metadata?.username ?? null,
          email: session.user.email ?? null,
        }
      );

      const { data: membershipData } = await supabase
        .from("memberships")
        .select("status, expires_at, plan")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const mem = membershipData as Membership | null;
      const now = new Date();
      const isActive =
        mem?.status === "active" && mem?.expires_at && new Date(mem.expires_at) > now;

      if (!isActive) {
        const expiredAt = mem?.expires_at ? new Date(mem.expires_at).getTime() : 0;
        const hoursSinceExpiry = expiredAt
          ? (now.getTime() - expiredAt) / (1000 * 60 * 60)
          : 999;
        const withinGracePeriod = hoursSinceExpiry >= 0 && hoursSinceExpiry <= GRACE_PERIOD_HOURS;
        router.replace(
          withinGracePeriod ? "/pricing?message=recently_expired" : "/pricing"
        );
        return;
      }
      setMembership(mem ?? null);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    logAuthEvent("logout");
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card">
          <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
          <p className="mt-6 text-center text-cb-green/80">Loading…</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="cb-card">
          <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
          <p className="mt-6 text-center text-cb-green/80">Loading Your Account…</p>
        </div>
      </main>
    );
  }

  const remainingHours = membership
    ? getRemainingHours(membership.expires_at)
    : 0;
  const showRenewalWarning = remainingHours > 0 && remainingHours < RENEWAL_WARNING_HOURS;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card max-w-lg">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle">Your Account</p>

        {/* Subscription Status Panel */}
        {membership && (
          <div className="mt-6 rounded-xl border border-cb-green/20 bg-cb-green/5 px-4 py-4">
            <h3 className="font-serif text-sm font-semibold text-cb-green">
              Subscription Status
            </h3>
            <dl className="mt-3 space-y-2 text-sm text-cb-green">
              <div className="flex justify-between">
                <dt className="text-cb-green/80">Current Plan</dt>
                <dd className="font-medium">{planDisplayName(membership.plan)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cb-green/80">Membership Status</dt>
                <dd className="font-medium capitalize">{membership.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cb-green/80">Expiry Date</dt>
                <dd>
                  {new Date(membership.expires_at).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cb-green/80">Access Remaining</dt>
                <dd className="font-medium">
                  {formatRemainingAccess(membership.expires_at)}
                </dd>
              </div>
            </dl>
            {showRenewalWarning && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
                Your access expires soon. Renew now to continue using the Capital Bridge
                advisory platform without interruption.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3 rounded-xl border border-cb-green/10 bg-white/60 px-4 py-4 text-sm text-cb-green">
          <p>
            <span className="font-medium text-cb-green/80">Username:</span>{" "}
            {profile.username ?? "—"}
          </p>
          <p>
            <span className="font-medium text-cb-green/80">Email:</span>{" "}
            {profile.email ?? "—"}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button type="button" onClick={handleLogout} className="cb-btn-primary">
            Log Out
          </button>
          <Link href="/pricing" className="cb-link rounded-xl px-4 py-3 text-center">
            View Plans
          </Link>
          <Link href="/" className="cb-link rounded-xl px-4 py-3 text-center">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
