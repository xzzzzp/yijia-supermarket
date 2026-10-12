import "server-only";

import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getCookiePath } from "@/lib/paths";

const DEV_SESSION_COOKIE = "yijia-dev-admin";

export interface AdminUser {
  id: string;
  email: string;
}

export function isDevAdminEnabled(): boolean {
  return (
    !isSupabaseConfigured() &&
    Boolean(process.env.ADMIN_DEV_EMAIL && process.env.ADMIN_DEV_PASSWORD)
  );
}

export function verifyDevCredentials(email: string, password: string): boolean {
  return (
    isDevAdminEnabled() &&
    email === process.env.ADMIN_DEV_EMAIL &&
    password === process.env.ADMIN_DEV_PASSWORD
  );
}

export async function setDevAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: getCookiePath(),
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDevAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: getCookiePath(),
    maxAge: 0,
  });
}

export async function getDevAdminSession(): Promise<AdminUser | null> {
  if (!isDevAdminEnabled()) return null;

  const cookieStore = await cookies();
  const session = cookieStore.get(DEV_SESSION_COOKIE);

  if (session?.value === "1") {
    return {
      id: "dev-admin",
      email: process.env.ADMIN_DEV_EMAIL!,
    };
  }

  return null;
}
