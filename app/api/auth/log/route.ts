import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthEventType =
  | "login_attempt"
  | "login_success"
  | "login_failure"
  | "signup_success"
  | "logout"
  | "password_reset_request"
  | "password_reset_success"
  | "password_change";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, metadata = {} } = body as {
      eventType: AuthEventType;
      metadata?: Record<string, unknown>;
    };
    if (!eventType) {
      return NextResponse.json(
        { error: "eventType required" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("auth_events").insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      metadata: { ...metadata, ts: new Date().toISOString() },
    });
    if (error) {
      console.error("auth_events insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/log error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
