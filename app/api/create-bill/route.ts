import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CONFIG, type BillplzPlanId } from "@/lib/billplz";

const BILLPLZ_API_URL =
  process.env.BILLPLZ_SANDBOX === "true"
    ? "https://www.billplz-sandbox.com/api/v3/bills"
    : "https://www.billplz.com/api/v3/bills";

const VALID_PLANS: BillplzPlanId[] = ["trial", "monthly", "advisor", "enterprise"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const plan = (body?.plan ?? "").toLowerCase().trim() as BillplzPlanId;
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Use trial, monthly, advisor, or enterprise." },
        { status: 400 }
      );
    }

    // RM1 trial: one per user (by email / account)
    if (plan === "trial") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("free_trial_used")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.free_trial_used) {
        return NextResponse.json(
          { error: "You have already used your RM 1 trial. Please choose another plan." },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.BILLPLZ_API_KEY;
    const collectionId = process.env.BILLPLZ_COLLECTION_ID;
    if (!apiKey || !collectionId) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 500 }
      );
    }

    const config = PLAN_CONFIG[plan];
    // Billplz requires callback_url and redirect_url per bill (no global dashboard webhook).
    // Callback: backend receives payment confirmation even if user closes the payment page.
    const callbackUrl =
      process.env.BILLPLZ_CALLBACK_URL ||
      "https://api.thecapitalbridge.com/api/billplz-webhook";
    const redirectUrl =
      process.env.BILLPLZ_REDIRECT_URL ||
      "https://platform.thecapitalbridge.com/dashboard";

    // User metadata for Billplz: required so the webhook can match payment to the correct user/subscription
    const email = user.email ?? "";
    const name =
      (user.user_metadata?.username as string)?.trim() ||
      (user.user_metadata?.full_name as string)?.trim() ||
      (email ? email.split("@")[0] : "") ||
      "Customer";

    const form = new URLSearchParams({
      collection_id: collectionId,
      email,
      name: name.slice(0, 255),
      amount: String(config.amountCents),
      callback_url: callbackUrl,
      redirect_url: redirectUrl,
      description: "Capital Bridge Advisory Platform Access",
      reference_1_label: "User ID",
      reference_1: user.id,
      reference_2_label: "Plan",
      reference_2: plan,
    });

    const res = await fetch(BILLPLZ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Billplz create bill error:", res.status, err);
      return NextResponse.json(
        { error: "Failed to create payment link." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { url?: string; id?: string };
    if (!data?.url) {
      return NextResponse.json(
        { error: "Invalid response from payment gateway." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: data.url, billId: data.id });
  } catch (e) {
    console.error("create-bill error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
