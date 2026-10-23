/**
 * 店面和后台共用的响应头。
 * 不设置 CSP：Next 与 Tailwind 需要内联脚本和样式，过严的策略容易把页面打坏。
 * 不设置 HSTS：HTTPS 由运维侧处理。
 */
export const securityHeaders: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];
