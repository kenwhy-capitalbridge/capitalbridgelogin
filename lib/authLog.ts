/**
 * Client-side helper to log auth events to the audit table.
 * Call after auth actions; failures are non-blocking.
 */
const API_LOG = "/api/auth/log";

export type AuthEventType =
  | "login_attempt"
  | "login_success"
  | "login_failure"
  | "signup_success"
  | "logout"
  | "password_reset_request"
  | "password_reset_success"
  | "password_change";

export function logAuthEvent(
  eventType: AuthEventType,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  fetch(API_LOG, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, metadata: metadata ?? {} }),
    credentials: "same-origin",
  }).catch(() => {});
}
