"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logAuthEvent } from "@/lib/authLog";
import { useSessionTimeout } from "@/lib/useSessionTimeout";

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
        router.replace("/pricing");
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle">Your Account</p>
        <div className="mt-8 space-y-3 rounded-xl border border-cb-green/10 bg-white/60 px-4 py-4 text-sm text-cb-green">
          <p>
            <span className="font-medium text-cb-green/80">Username:</span>{" "}
            {profile.username ?? "—"}
          </p>
          <p>
            <span className="font-medium text-cb-green/80">Email:</span>{" "}
            {profile.email ?? "—"}
          </p>
          {membership && (
            <p>
              <span className="font-medium text-cb-green/80">Plan:</span>{" "}
              {membership.plan.replace(/_/g, " ")} · Expires{" "}
              {new Date(membership.expires_at).toLocaleDateString()}
            </p>
          )}
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
