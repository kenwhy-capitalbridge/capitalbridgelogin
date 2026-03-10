import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Free trial is no longer available. Start your 7-day trial for RM 1 from the pricing page.",
      redirect: "/pricing",
    },
    { status: 410 }
  );
}
