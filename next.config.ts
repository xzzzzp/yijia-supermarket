import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const allowedDevOrigins = (
  process.env.ALLOWED_DEV_ORIGINS ?? "172.16.1.152,127.0.0.1"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(basePath ? { basePath, trailingSlash: true } : {}),
  async headers() {
    return [
      { source: "/", headers: [...securityHeaders] },
      { source: "/:path*", headers: [...securityHeaders] },
    ];
  },
  allowedDevOrigins,
  serverExternalPackages: ["mysql2"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
