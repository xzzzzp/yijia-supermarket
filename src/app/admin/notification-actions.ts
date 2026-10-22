"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSession } from "@/lib/dev-auth";
import type { InAppNotificationPollResult } from "@/lib/notification-hint";
import {
  getInAppNotificationHint,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
} from "@/lib/notifications.server";
import { hasCapability } from "@/lib/staff-access";
import { lookupStaffAccess } from "@/lib/staff.server";

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

/**
 * 已登录且具备接单通知权限时，返回未读数和最新通知。
 * 没有该权限时 enabled 为 false，调用方应停止轮询。
 */
export async function pollInAppNotificationHint(): Promise<InAppNotificationPollResult> {
  const session = await getAdminSession();
  if (!session) return { ok: true, enabled: false };

  const user = await lookupStaffAccess(session.staffId, session.email);
  if (!user?.staffId) return { ok: false, message: "暂时无法确认权限" };
  if (!hasCapability(user, "orderNotifications")) return { ok: true, enabled: false };

  const hint = await getInAppNotificationHint(user.staffId);
  if (!hint) return { ok: false, message: "暂时无法读取通知" };
  return { ok: true, enabled: true, ...hint };
}
