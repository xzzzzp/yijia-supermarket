/** 短窗口内的失败次数上限。达到后进入短暂锁定。 */
export const LOGIN_FAILURE_LIMIT = 5;
/** 失败计数窗口。窗口结束且未锁定时，计数清零。 */
export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
/** 达到上限后的固定锁定时间。锁定期间再次失败不会把锁定时间往后推。 */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

type Bucket = {
  failures: number;
  windowStartedAt: number;
  lockedUntil: number;
};

const buckets = new Map<string, Bucket>();

function bucketKey(ip: string): string {
  const trimmed = ip.trim().slice(0, 64);
  return trimmed || "unknown";
}

function prune(now: number): void {
  if (buckets.size < 1000) return;
  for (const [id, bucket] of buckets) {
    if (bucket.lockedUntil <= now && now - bucket.windowStartedAt >= LOGIN_WINDOW_MS) {
      buckets.delete(id);
    }
  }
}

export function loginLockRemaining(ip: string, now = Date.now()): number {
  const bucket = buckets.get(bucketKey(ip));
  if (!bucket || bucket.lockedUntil <= now) return 0;
  return bucket.lockedUntil - now;
}

export function recordLoginFailure(
  ip: string,
  now = Date.now(),
): { locked: boolean; retryAfterMs: number } {
  const id = bucketKey(ip);
  const existing = buckets.get(id);
  if (existing && existing.lockedUntil > now) {
    return { locked: true, retryAfterMs: existing.lockedUntil - now };
  }

  const bucket: Bucket =
    existing && now - existing.windowStartedAt < LOGIN_WINDOW_MS
      ? existing
      : { failures: 0, windowStartedAt: now, lockedUntil: 0 };
  bucket.failures += 1;
  if (bucket.failures >= LOGIN_FAILURE_LIMIT) {
    bucket.lockedUntil = now + LOGIN_LOCKOUT_MS;
  }
  buckets.set(id, bucket);
  prune(now);

  if (bucket.lockedUntil > now) {
    return { locked: true, retryAfterMs: bucket.lockedUntil - now };
  }
  return { locked: false, retryAfterMs: 0 };
}

export function recordLoginSuccess(ip: string): void {
  buckets.delete(bucketKey(ip));
}

export function resetLoginRateLimits(): void {
  buckets.clear();
}
