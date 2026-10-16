"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createStaffMember,
  deleteStaffMember,
  updateStaffMember,
} from "@/lib/staff.server";

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
  const { error } = await requireOwnerAccount();
  if (error) return error;

  const result = await createStaffMember({
    email: String(formData.get("email") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    authUserId: String(formData.get("authUserId") ?? ""),
    isOwner: flag(formData, "isOwner"),
    orderNotifications: flag(formData, "orderNotifications"),
    viewStats: flag(formData, "viewStats"),
    fulfillment: flag(formData, "fulfillment"),
    manageProducts: flag(formData, "manageProducts"),
  });

  revalidatePath("/admin/staff");
  return result;
}

export async function updateStaffAction(formData: FormData) {
  const { error } = await requireOwnerAccount();
  if (error) return error;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false as const, message: "缺少店员编号" };

  const result = await updateStaffMember(id, {
    displayName: String(formData.get("displayName") ?? ""),
    authUserId: String(formData.get("authUserId") ?? ""),
    isOwner: flag(formData, "isOwner"),
    orderNotifications: flag(formData, "orderNotifications"),
    viewStats: flag(formData, "viewStats"),
    fulfillment: flag(formData, "fulfillment"),
    manageProducts: flag(formData, "manageProducts"),
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return result;
}

export async function deleteStaffAction(staffId: string) {
  const { user, error } = await requireOwnerAccount();
  if (error || !user) return error ?? { ok: false as const, message: "仅店主可以配置店员权限" };

  const result = await deleteStaffMember(staffId, { id: user.id, email: user.email });
  revalidatePath("/admin/staff");
  return result;
}
