import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BILLPLZ_API_URL =
  process.env.BILLPLZ_SANDBOX === "true"
    ? "https://www.billplz-sandbox.com/api/v3/bills"
    : "https://www.billplz.com/api/v3/bills";

const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? "https://advisoryplatform.thecapitalbridge.com"
    : "http://localhost:3002"; // advisory app origin in dev

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401, headers: corsHeaders },
      );
    }

    const body = await request.json().catch(() => ({}));
    const planId = String(body?.plan_id ?? body?.plan ?? "")
      .toLowerCase()
      .trim();
    if (!planId) {
      return NextResponse.json(
        { error: "Missing plan_id" },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select(
        "id, name, price, duration_days, billplz_collection_id, active",
      )
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan || !plan.active) {
      return NextResponse.json(
        { error: "Invalid or inactive plan" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (plan.id === "trial") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_count")
        .eq("id", user.id)
        .maybeSingle();

      const count = profile?.trial_count ?? 0;
      if (count >= 3) {
        return NextResponse.json(
          {
            error:
              "You have fully utilised your trial limit. Please choose a full access plan to continue.",
          },
          { status: 400, headers: corsHeaders },
        );
      }
    }

    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("plan_id", plan.id)
      .eq("status", "pending")
      .maybeSingle();

    let membershipId: string;

    if (existingMembership?.id) {
      membershipId = existingMembership.id;
    } else {
      const { data: newMembership, error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: "pending",
          start_date: null,
          end_date: null,
        })
        .select("id")
        .single();

      if (membershipError || !newMembership) {
        console.error("create-bill: membership insert error", membershipError);
        return NextResponse.json(
          { error: "Could not create membership" },
          { status: 500, headers: corsHeaders },
        );
      }

      membershipId = newMembership.id;
    }

    const apiKey = process.env.BILLPLZ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 500, headers: corsHeaders },
      );
    }

    const callbackUrl =
      process.env.BILLPLZ_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/billplz-webhook`;

    const redirectUrl =
      process.env.BILLPLZ_REDIRECT_URL ||
      "https://advisoryplatform.thecapitalbridge.com/payment-status";

    const collectionId =
      plan.billplz_collection_id || process.env.BILLPLZ_COLLECTION_ID;
    if (!collectionId) {
      return NextResponse.json(
        { error: "Billplz collection not configured." },
        { status: 500, headers: corsHeaders },
      );
    }

    const amountSen = Math.round(Number(plan.price) * 100);

    const email = user.email ?? "";
    const name =
      (user.user_metadata?.full_name as string)?.trim() ||
      (email ? email.split("@")[0] : "") ||
      "Customer";

    const form = new URLSearchParams({
      collection_id: collectionId,
      email,
      name: name.slice(0, 255),
      amount: String(amountSen),
      callback_url: callbackUrl,
      redirect_url: redirectUrl,
      description: plan.name,
      reference_1_label: "Membership ID",
      reference_1: membershipId,
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
        { status: 502, headers: corsHeaders },
      );
    }

    const data = (await res.json()) as { url?: string; id?: string };
    if (!data?.url) {
      return NextResponse.json(
        { error: "Invalid response from payment gateway." },
        { status: 502, headers: corsHeaders },
      );
    }

    const { error: paymentError } = await supabase.from("payments").upsert(
      {
        user_id: user.id,
        membership_id: membershipId,
        billplz_bill_id: data.id,
        amount: plan.price,
        status: "pending",
      },
      { onConflict: "billplz_bill_id" },
    );

    if (paymentError) {
      console.error("create-bill: payment upsert error", paymentError);
    }

    return NextResponse.json(
      { url: data.url, billId: data.id, checkoutUrl: data.url },
      { headers: corsHeaders },
    );
  } catch (e) {
    console.error("create-bill error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: corsHeaders },
    );
  }
}
