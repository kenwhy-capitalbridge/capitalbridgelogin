import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_TRIAL_DAYS = 7;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("free_trial_used")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.free_trial_used) {
      return NextResponse.json(
        { error: "Free trial already used.", redirect: "/select-plan" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + FREE_TRIAL_DAYS);

    const supabaseService = await import("@supabase/supabase-js").then((m) =>
      m.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    );

    const { error: membershipErr } = await supabaseService
      .from("memberships")
      .upsert(
        {
          user_id: user.id,
          plan: "free_trial",
          status: "active",
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (membershipErr) {
      console.error("activate-free-trial membership error:", membershipErr);
      return NextResponse.json(
        { error: "Failed to activate trial." },
        { status: 500 }
      );
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ free_trial_used: true })
      .eq("id", user.id);

    if (profileErr) {
      console.error("activate-free-trial profile update error:", profileErr);
    }

    return NextResponse.json({ redirect: "/advisory-platform" });
  } catch (e) {
    console.error("activate-free-trial error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
