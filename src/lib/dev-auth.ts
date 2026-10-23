import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { isMysqlConfigured } from "@/lib/mysql";
import { getCookiePath } from "@/lib/paths";
import { resolveSessionSecret } from "@/lib/session-secret";

const SESSION_COOKIE = "yijia-admin-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AdminUser {
  id: string;
  email: string;
}

interface SessionPayload {
  staffId: string;
  email: string;
  exp: number;
}

export function isDevAdminEnabled(): boolean {
  return (
    !isMysqlConfigured() &&
    Boolean(process.env.ADMIN_DEV_EMAIL && process.env.ADMIN_DEV_PASSWORD)
  );
}

export function verifyDevCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_DEV_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_DEV_PASSWORD;
  return (
    isDevAdminEnabled() &&
    Boolean(expectedEmail && expectedPassword) &&
    email.trim().toLowerCase() === expectedEmail &&
    password === expectedPassword
  );
}

function sessionSecret(): string | null {
  return resolveSessionSecret();
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * 只在浏览器实际走 HTTPS 时加 Secure。
 * 生产同时监听 HTTP，且没有强制跳到 HTTPS。若按 NODE_ENV=production 一律加 Secure，
 * 浏览器会丢掉 Set-Cookie。登录 Server Action 仍会把后台页面流式返回，所以列表看起来已登录，
 * 下一次打开编辑页是新请求，没有 Cookie，requireAdmin() 会转到 /admin/login?error=auth。
 * Next 会根据连接或 nginx 的 X-Forwarded-Proto 写入该请求头（见 deploy/patch-nginx.sh）。
 */
async function requestIsHttps(): Promise<boolean> {
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}

async function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: await requestIsHttps(),
    path: getCookiePath(),
    maxAge,
  };
}

export async function setAdminSession(user: { staffId: string; email: string }): Promise<void> {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error("缺少 ADMIN_SESSION_SECRET 或 ADMIN_DEV_PASSWORD，无法签发后台会话");
  }

  const body: SessionPayload = {
    staffId: user.staffId,
    email: user.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${encoded}.${sign(encoded, secret)}`, await sessionCookieOptions(SESSION_TTL_SECONDS));
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", await sessionCookieOptions(0));
}

export async function getAdminSession(): Promise<{ staffId: string; email: string } | null> {
  const secret = sessionSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded, secret);
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.staffId || !payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { staffId: payload.staffId, email: payload.email };
  } catch {
    return null;
  }
}
