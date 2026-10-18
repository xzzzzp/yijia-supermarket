"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { markAllInAppNotificationsRead, markInAppNotificationRead } from "@/lib/notifications.server";
import { hasCapability } from "@/lib/staff-access";

async function requireNotificationReader() {
  const user = await requireAdmin();
  if (!user.staffId || !hasCapability(user, "orderNotifications")) {
    return { user: null, error: { ok: false as const, message: "没有接单通知权限" } };
  }
  return { user, error: null };
}

function refreshNotificationViews() {
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

export async function markNotificationReadAction(notificationId: string) {
  const { user, error } = await requireNotificationReader();
  if (error || !user?.staffId) return error ?? { ok: false as const, message: "没有接单通知权限" };

  const result = await markInAppNotificationRead(notificationId, user.staffId);
  refreshNotificationViews();
  return result;
}

export async function markAllNotificationsReadAction() {
  const { user, error } = await requireNotificationReader();
  if (error || !user?.staffId) return error ?? { ok: false as const, message: "没有接单通知权限" };

  const result = await markAllInAppNotificationsRead(user.staffId);
  refreshNotificationViews();
  return result;
}
