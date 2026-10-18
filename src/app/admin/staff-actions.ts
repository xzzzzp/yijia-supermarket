"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit.server";
import {
  createStaffMember,
  deleteStaffMember,
  updateStaffMember,
} from "@/lib/staff.server";
import type { AdminSession } from "@/types/staff";
import type { AuditAction } from "@/types/audit";

function writeAudit(
  user: Pick<AdminSession, "email" | "staffId">,
  input: { action: AuditAction; targetId?: string | null; summary: string },
) {
  return recordAudit({
    actorEmail: user.email,
    actorStaffId: user.staffId,
    action: input.action,
    targetType: "staff",
    targetId: input.targetId,
    summary: input.summary,
  });
}

function flag(formData: FormData, name: string): boolean {
  return formData.getAll(name).includes("1");
}

async function requireOwnerAccount() {
  const user = await requireAdmin();
  if (!user.isOwner) {
    return { user: null, error: { ok: false as const, message: "仅店主可以配置店员权限" } };
  }
  return { user, error: null };
}

export async function createStaffAction(formData: FormData) {
  const { user, error } = await requireOwnerAccount();
  if (error || !user) return error ?? { ok: false as const, message: "仅店主可以配置店员权限" };

  const email = String(formData.get("email") ?? "");
  const result = await createStaffMember({
    email,
    displayName: String(formData.get("displayName") ?? ""),
    password: String(formData.get("password") ?? ""),
    isOwner: flag(formData, "isOwner"),
    orderNotifications: flag(formData, "orderNotifications"),
    viewStats: flag(formData, "viewStats"),
    fulfillment: flag(formData, "fulfillment"),
    manageProducts: flag(formData, "manageProducts"),
  });

  if (result.ok) {
    await writeAudit(user, {
      action: "staff.create",
      targetId: result.staffId ?? result.email ?? email,
      summary: `新增店员 ${result.email ?? email.trim().toLowerCase()}`,
    });
  }

  revalidatePath("/admin/staff");
  return result;
}

export async function updateStaffAction(formData: FormData) {
  const { user, error } = await requireOwnerAccount();
  if (error || !user) return error ?? { ok: false as const, message: "仅店主可以配置店员权限" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false as const, message: "缺少店员编号" };

  const displayName = String(formData.get("displayName") ?? "");
  const result = await updateStaffMember(id, {
    displayName,
    password: String(formData.get("password") ?? ""),
    isOwner: flag(formData, "isOwner"),
    orderNotifications: flag(formData, "orderNotifications"),
    viewStats: flag(formData, "viewStats"),
    fulfillment: flag(formData, "fulfillment"),
    manageProducts: flag(formData, "manageProducts"),
  });

  if (result.ok) {
    const label = result.email || displayName.trim() || id;
    await writeAudit(user, {
      action: "staff.update",
      targetId: id,
      summary: `更新店员 ${label}`,
    });
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return result;
}

export async function deleteStaffAction(staffId: string) {
  const { user, error } = await requireOwnerAccount();
  if (error || !user) return error ?? { ok: false as const, message: "仅店主可以配置店员权限" };

  const result = await deleteStaffMember(staffId, { id: user.id, email: user.email });
  if (result.ok) {
    await writeAudit(user, {
      action: "staff.delete",
      targetId: staffId,
      summary: `删除店员 ${result.email ?? staffId}`,
    });
  }
  revalidatePath("/admin/staff");
  return result;
}
