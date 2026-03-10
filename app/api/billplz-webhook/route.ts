import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBillplzSignature } from "@/lib/billplz";

// Webhook must write to memberships and payments; use service role to bypass RLS.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

    const billId = params.id ?? "";
    const paid = params.paid === "true" && params.state === "paid";

    const supabase = getServiceClient();
    if (!supabase) {
      console.error("billplz-webhook: Supabase service role not configured");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // 1) Lookup payment by bill id
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, user_id, membership_id, status")
      .eq("billplz_bill_id", billId)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("billplz-webhook: payment not found for bill", billId, paymentError);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Idempotency
    if (payment.status === "paid") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (!paid) {
      // Mark as failed; membership remains pending
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return NextResponse.json({ ok: true, paid: false });
    }

    const paidAt = params.paid_at
      ? new Date(params.paid_at).toISOString()
      : new Date().toISOString();
    const amount = (parseInt(params.paid_amount || params.amount || "0", 10) ||
      0) / 100;

    // 2) Mark payment as paid
    const { error: payUpdateError } = await supabase
      .from("payments")
      .update({ status: "paid", paid_at: paidAt, amount })
      .eq("id", payment.id);

    if (payUpdateError) {
      console.error("billplz-webhook: payment update failed", payUpdateError);
      return NextResponse.json(
        { error: "Payment update failed" },
        { status: 500 }
      );
    }

    // 3) Activate membership based on plan duration
    const { data: membership, error: memError } = await supabase
      .from("memberships")
      .select("id, user_id, plan_id, status")
      .eq("id", payment.membership_id)
      .maybeSingle();

    if (memError || !membership) {
      console.error("billplz-webhook: membership not found", memError);
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, duration_days")
      .eq("id", membership.plan_id)
      .maybeSingle();

    if (planError || !plan) {
      console.error("billplz-webhook: plan not found", planError);
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    const { error: membershipUpdateError } = await supabase
      .from("memberships")
      .update({
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })
      .eq("id", membership.id);

    if (membershipUpdateError) {
      console.error("billplz-webhook: membership update failed", membershipUpdateError);
      return NextResponse.json(
        { error: "Membership update failed" },
        { status: 500 }
      );
    }

    // 4) Increment trial_count if this is the trial plan
    if (plan.id === "trial") {
      const { data: profile, error: profError } = await supabase
        .from("profiles")
        .select("trial_count")
        .eq("id", membership.user_id)
        .maybeSingle();

      if (profError) {
        console.error("billplz-webhook: profile fetch error", profError);
      } else {
        const current = profile?.trial_count ?? 0;
        const { error: trialUpdateError } = await supabase
          .from("profiles")
          .update({ trial_count: current + 1 })
          .eq("id", membership.user_id);
        if (trialUpdateError) {
          console.error("billplz-webhook: trial_count update error", trialUpdateError);
        }
      }
    }

    return NextResponse.json({ ok: true, paid: true });
  } catch (e) {
    console.error("billplz-webhook error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
