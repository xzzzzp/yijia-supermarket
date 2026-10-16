import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getDevAdminSession, type AdminUser } from "@/lib/dev-auth";
import { resolveStaffAccess } from "@/lib/staff.server";
import type { AdminSession } from "@/types/staff";

async function requireIdentity(): Promise<AdminUser> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/admin/login");
    }

    return { id: user.id, email: user.email ?? "admin" };
  }

  const devUser = await getDevAdminSession();
  if (devUser) {
    return devUser;
  }

  redirect("/admin/login?error=auth");
}

export async function requireAdmin(): Promise<AdminSession> {
  const identity = await requireIdentity();
  return resolveStaffAccess(identity.id, identity.email);
}

export function getAdminAuthMode(): "supabase" | "dev" | "none" {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.ADMIN_DEV_EMAIL && process.env.ADMIN_DEV_PASSWORD) {
    return "dev";
  }
  return "none";
}
