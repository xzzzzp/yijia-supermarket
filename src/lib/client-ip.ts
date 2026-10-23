const MAX_IP_LENGTH = 64;

/** 与操作日志相同：优先 X-Forwarded-For 的第一段，否则 X-Real-IP。 */
export function clientAddress(
  forwardedFor: string | null | undefined,
  realIp: string | null | undefined,
): string {
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "";
  return candidate.length <= MAX_IP_LENGTH ? candidate : candidate.slice(0, MAX_IP_LENGTH);
}
