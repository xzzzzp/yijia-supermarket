import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { isMysqlConfigured } from "@/lib/mysql";
import { getCookiePath } from "@/lib/paths";

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
    process.env.NODE_ENV !== "production" &&
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
  const dedicated = process.env.ADMIN_SESSION_SECRET?.trim();
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") return null;
  return process.env.ADMIN_DEV_PASSWORD?.trim() || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function setAdminSession(user: { staffId: string; email: string }): Promise<void> {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? "缺少 ADMIN_SESSION_SECRET，无法签发后台会话"
        : "缺少 ADMIN_SESSION_SECRET 或 ADMIN_DEV_PASSWORD，无法签发后台会话",
    );
  }

  const body: SessionPayload = {
    staffId: user.staffId,
    email: user.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${encoded}.${sign(encoded, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: getCookiePath(),
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: getCookiePath(),
    maxAge: 0,
  });
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
