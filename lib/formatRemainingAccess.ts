/**
 * Format remaining access time until expires_at for display in subscription panel.
 * Returns e.g. "18 hours", "27 days", "82 days".
 */
export function formatRemainingAccess(expiresAt: string): string {
  const end = new Date(expiresAt);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "Expired";

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

/**
 * Return remaining time in hours (for grace period and renewal warning).
 */
export function getRemainingHours(expiresAt: string): number {
  const end = new Date(expiresAt);
  const now = new Date();
  return (end.getTime() - now.getTime()) / (1000 * 60 * 60);
}
