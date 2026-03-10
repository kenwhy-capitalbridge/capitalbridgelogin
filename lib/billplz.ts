import crypto from "crypto";

/**
 * Verify Billplz X-Signature callback.
 * Build source string from all params except x_signature: sort keys ascending, key+value, join with |.
 * Then HMAC-SHA256 with X-Signature key.
 */
export function verifyBillplzSignature(
  params: Record<string, string | undefined>,
  xSignatureKey: string
): boolean {
  const received = params.x_signature;
  if (!received) return false;

  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "x_signature") continue;
    filtered[k] = v === undefined || v === null ? "" : String(v);
  }

  const sortedKeys = Object.keys(filtered).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  const source = sortedKeys.map((k) => k + filtered[k]).join("|");
  const expected = crypto
    .createHmac("sha256", xSignatureKey)
    .update(source)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(received, "hex"),
    Buffer.from(expected, "hex")
  );
}

export const PLAN_CONFIG = {
  trial: { amountCents: 100, days: 7 },         // RM 1
  monthly: { amountCents: 20000, days: 30 },    // RM 200
  advisor: { amountCents: 54000, days: 90 },    // RM 540
  enterprise: { amountCents: 240000, days: 365 }, // RM 2,400
} as const;

export type BillplzPlanId = keyof typeof PLAN_CONFIG;
