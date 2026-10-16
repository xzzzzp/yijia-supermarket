import "server-only";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/dev-auth";
import { isMysqlConfigured } from "@/lib/mysql";
import { resolveStaffAccess } from "@/lib/staff.server";
import type { AdminSession } from "@/types/staff";

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login?error=auth");
  }

  const access = await resolveStaffAccess(session.staffId, session.email);
  if (!access) {
    redirect("/admin/login?error=auth");
  }
  return access;
}

export function getAdminAuthMode(): "mysql" | "dev" | "none" {
  if (isMysqlConfigured()) return "mysql";
  if (process.env.ADMIN_DEV_EMAIL && process.env.ADMIN_DEV_PASSWORD) return "dev";
  return "none";
}
