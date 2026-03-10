import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type BillplzPlanId } from "@/lib/billplz";

const VALID_PLANS: BillplzPlanId[] = ["trial", "monthly", "advisor", "enterprise"];

/**
 * After signup, attach the selected plan to the user and set status to pending payment.
 * Called by the client once the user is authenticated.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const plan = (body?.plan ?? "").toLowerCase().trim() as BillplzPlanId;
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Use trial, monthly, advisor, or enterprise." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        pending_plan: plan,
        payment_status: "pending",
      })
      .eq("id", user.id);

    if (error) {
      console.error("set-pending-plan error:", error);
      return NextResponse.json(
        { error: "Failed to set pending plan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    console.error("set-pending-plan error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
