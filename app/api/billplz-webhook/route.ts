import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBillplzSignature, PLAN_CONFIG, type BillplzPlanId } from "@/lib/billplz";

// Webhook must write to memberships and payments; use service role to bypass RLS.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const VALID_PLANS: BillplzPlanId[] = ["monthly", "advisor", "enterprise"];

export async function POST(request: NextRequest) {
  try {
    const xSignatureKey = process.env.BILLPLZ_X_SIGNATURE_KEY;
    if (!xSignatureKey) {
      console.error("billplz-webhook: BILLPLZ_X_SIGNATURE_KEY not set");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "";
    let params: Record<string, string | undefined>;
    if (contentType.includes("application/json")) {
      const body = await request.json();
      params = Object.fromEntries(
        Object.entries(body).map(([k, v]) => [k, v == null ? "" : String(v)])
      ) as Record<string, string | undefined>;
    } else {
      const text = await request.text();
      params = Object.fromEntries(
        new URLSearchParams(text)
      ) as Record<string, string | undefined>;
    }

    if (!verifyBillplzSignature(params, xSignatureKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const paid = params.paid === "true" && params.state === "paid";
    if (!paid) {
      return NextResponse.json({ received: true });
    }

    const userId = params.reference_1?.trim();
    const plan = (params.reference_2?.trim() ?? "").toLowerCase() as BillplzPlanId;
    if (!userId || !VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: "Missing or invalid reference" }, { status: 400 });
    }

    const config = PLAN_CONFIG[plan];
    const amountSen = parseInt(params.paid_amount || params.amount || "0", 10) || config.amountCents;
    const billId = params.id ?? "";
    const paidAt = params.paid_at
      ? new Date(params.paid_at).toISOString()
      : new Date().toISOString();

    const supabase = getServiceClient();
    if (!supabase) {
      console.error("billplz-webhook: Supabase service role not configured");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Idempotency: skip if we already processed this bill
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("billplz_bill_id", billId)
      .maybeSingle();
    if (existingPayment) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const { data: existing } = await supabase
      .from("memberships")
      .select("expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    let newExpiry: Date;
    const now = new Date();
    if (existing?.expires_at) {
      const expiry = new Date(existing.expires_at);
      newExpiry = expiry > now ? new Date(expiry) : new Date(now);
    } else {
      newExpiry = new Date(now);
    }
    newExpiry.setDate(newExpiry.getDate() + config.days);

    const { error: updateErr } = await supabase
      .from("memberships")
      .upsert(
        {
          user_id: userId,
          plan: plan,
          status: "active",
          expires_at: newExpiry.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (updateErr) {
      console.error("billplz-webhook: membership upsert error", updateErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const { error: payErr } = await supabase.from("payments").insert({
      user_id: userId,
      plan: plan,
      billplz_bill_id: billId,
      amount: amountSen,
      payment_status: "completed",
      paid_at: paidAt,
    });

    if (payErr) {
      console.error("billplz-webhook: payment insert error", payErr);
      return NextResponse.json({ error: "Payment record failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("billplz-webhook error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
