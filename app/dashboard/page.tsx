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

const SESSION_TIMEOUT_MINUTES = typeof process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES !== "undefined"
  ? Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES) || 30
  : 30;

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
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
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) {
        console.error("Profile fetch error:", error);
      }
      setProfile(
        data ?? {
          id: session.user.id,
          username: session.user.user_metadata?.username ?? null,
          email: session.user.email ?? null,
        }
      );
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
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button type="button" onClick={handleLogout} className="cb-btn-primary">
            Log Out
          </button>
          <Link href="/" className="cb-link rounded-xl px-4 py-3 text-center">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
