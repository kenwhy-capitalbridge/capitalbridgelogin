import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CONFIG, type BillplzPlanId } from "@/lib/billplz";

const BILLPLZ_API_URL =
  process.env.BILLPLZ_SANDBOX === "true"
    ? "https://www.billplz-sandbox.com/api/v3/bills"
    : "https://www.billplz.com/api/v3/bills";

const VALID_PLANS: BillplzPlanId[] = ["monthly", "advisor", "enterprise"];

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
        { error: "Invalid plan. Use monthly, advisor, or enterprise." },
        { status: 400 }
      );
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
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      request.nextUrl?.origin ||
      "https://login.thecapitalbridge.com";
    const base = baseUrl.replace(/\/$/, "");
    const redirectUrl = `${base}/dashboard`;
    const callbackUrl = `${base}/api/billplz-webhook`;

    const name =
      (user.user_metadata?.username as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "Customer";

    const form = new URLSearchParams({
      collection_id: collectionId,
      email: user.email,
      name: name.slice(0, 255),
      amount: String(config.amountCents),
      callback_url: callbackUrl,
      redirect_url: redirectUrl,
      description: "Capital Bridge Advisory Platform Subscription",
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
