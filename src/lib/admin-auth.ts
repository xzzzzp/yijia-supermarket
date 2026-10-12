import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getDevAdminSession, type AdminUser } from "@/lib/dev-auth";

export async function requireAdmin(): Promise<AdminUser> {
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

export function getAdminAuthMode(): "supabase" | "dev" | "none" {
  if (isSupabaseConfigured()) return "supabase";
  if (
    process.env.ADMIN_DEV_EMAIL &&
    process.env.ADMIN_DEV_PASSWORD
  ) {
    return "dev";
  }
  return "none";
}
