import "server-only";

import { randomUUID } from "crypto";
import { cache } from "react";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { readLocalStaff, writeLocalStaff } from "@/lib/local-data";
import { capabilitiesFor, EMPTY_CAPABILITIES } from "@/lib/staff-access";
import type { AdminSession, StaffDirectory, StaffRecord, StaffStoreSource } from "@/types/staff";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface StaffRow {
  id: string;
  auth_user_id: string | null;
  email: string;
  display_name: string | null;
  is_owner: boolean;
  order_notifications: boolean;
  view_stats: boolean;
  fulfillment: boolean;
  manage_products: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email?: string | null;
}

interface AuthAdmin {
  auth: {
    admin: {
      getUserById: (id: string) => Promise<{
        data: { user: AuthUser | null };
        error: { message: string } | null;
      }>;
      listUsers: (params?: { page?: number; perPage?: number }) => Promise<{
        data: { users: AuthUser[] } | null;
        error: { message: string } | null;
      }>;
      inviteUserByEmail: (email: string) => Promise<{
        data: { user: AuthUser | null } | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export interface StaffWriteInput {
  displayName: string;
  authUserId: string | null;
  isOwner: boolean;
  orderNotifications: boolean;
  viewStats: boolean;
  fulfillment: boolean;
  manageProducts: boolean;
}

export interface CreateStaffInput extends StaffWriteInput {
  email: string;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function rowToStaff(row: StaffRow): StaffRecord {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email.trim().toLowerCase(),
    displayName: row.display_name?.trim() || row.email,
    isOwner: row.is_owner,
    orderNotifications: row.order_notifications,
    viewStats: row.view_stats,
    fulfillment: row.fulfillment,
    manageProducts: row.manage_products,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function staffToRow(staff: StaffRecord) {
  return {
    id: staff.id,
    auth_user_id: staff.authUserId && isUuid(staff.authUserId) ? staff.authUserId : null,
    email: staff.email.trim().toLowerCase(),
    display_name: staff.displayName,
    is_owner: staff.isOwner,
    order_notifications: staff.orderNotifications,
    view_stats: staff.viewStats,
    fulfillment: staff.fulfillment,
    manage_products: staff.manageProducts,
    created_at: staff.createdAt,
    updated_at: staff.updatedAt,
  };
}

function readableDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("staff") && lower.includes("does not exist")) {
    return "店员表尚未创建。请在 Supabase 执行 schema.sql 中的店员权限升级语句。";
  }
  if (lower.includes("duplicate") && lower.includes("email")) {
    return "该邮箱已是店员";
  }
  if (lower.includes("duplicate") && lower.includes("auth_user")) {
    return "该登录账号已绑定其他店员";
  }
  return message;
}

function findStaffForUser(
  staff: StaffRecord[],
  user: { id: string; email: string },
): StaffRecord | undefined {
  const byId = staff.find((member) => member.authUserId && member.authUserId === user.id);
  if (byId) return byId;

  const email = user.email.trim().toLowerCase();
  return staff.find(
    (member) => member.email === email && (!member.authUserId || member.authUserId === user.id),
  );
}

function toAccess(user: { id: string; email: string }, staff: StaffRecord | null): AdminSession {
  if (!staff) {
    return {
      id: user.id,
      email: user.email,
      staffId: null,
      isOwner: false,
      capabilities: EMPTY_CAPABILITIES,
    };
  }

  return {
    id: user.id,
    email: user.email,
    staffId: staff.id,
    isOwner: staff.isOwner,
    capabilities: capabilitiesFor(staff),
  };
}

async function readSupabaseStaff(): Promise<StaffRecord[] | null> {
  if (!hasSupabaseAdmin()) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("staff")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Failed to list staff from Supabase:", error.message);
      return null;
    }

    return ((data ?? []) as StaffRow[]).map(rowToStaff);
  } catch (err) {
    console.warn("Failed to list staff from Supabase:", err);
    return null;
  }
}

export async function loadStaffDirectory(): Promise<StaffDirectory> {
  if (hasSupabaseAdmin()) {
    const remote = await readSupabaseStaff();
    if (remote) {
      return { source: "supabase", staff: remote };
    }

    return {
      source: "local",
      staff: await readLocalStaff(),
      warning:
        "未能读取 Supabase 店员表，当前使用本地 data/staff.json。请先在 SQL Editor 执行 schema.sql 中的店员表升级。",
    };
  }

  return { source: "local", staff: await readLocalStaff() };
}

async function persistStaff(
  record: StaffRecord,
  source: StaffStoreSource,
  mode: "insert" | "update",
): Promise<void> {
  if (source === "supabase") {
    const admin = createAdminClient();
    const query =
      mode === "insert"
        ? admin.from("staff").insert(staffToRow(record))
        : admin.from("staff").update(staffToRow(record)).eq("id", record.id);
    const { error } = await query;
    if (error) throw new Error(readableDbError(error.message));

    const latest = await readSupabaseStaff();
    if (latest) await writeLocalStaff(latest);
    return;
  }

  const staff = await readLocalStaff();
  const index = staff.findIndex((member) => member.id === record.id);

  if (mode === "insert") {
    if (staff.some((member) => member.email === record.email)) {
      throw new Error("该邮箱已是店员");
    }
    if (record.authUserId && staff.some((member) => member.authUserId === record.authUserId)) {
      throw new Error("该登录账号已绑定其他店员");
    }
    staff.push(record);
  } else if (index === -1) {
    throw new Error("未找到该店员");
  } else {
    const emailTaken = staff.some(
      (member) => member.id !== record.id && member.email === record.email,
    );
    const authTaken = Boolean(
      record.authUserId &&
        staff.some((member) => member.id !== record.id && member.authUserId === record.authUserId),
    );
    if (emailTaken) throw new Error("该邮箱已是店员");
    if (authTaken) throw new Error("该登录账号已绑定其他店员");
    staff[index] = record;
  }

  await writeLocalStaff(staff);
}

async function deletePersistedStaff(id: string, source: StaffStoreSource): Promise<void> {
  if (source === "supabase") {
    const admin = createAdminClient();
    const { error } = await admin.from("staff").delete().eq("id", id);
    if (error) throw new Error(readableDbError(error.message));
    const latest = await readSupabaseStaff();
    if (latest) await writeLocalStaff(latest);
    return;
  }

  const staff = await readLocalStaff();
  await writeLocalStaff(staff.filter((member) => member.id !== id));
}

function newOwnerRecord(user: { id: string; email: string }): StaffRecord {
  const now = new Date().toISOString();
  const email = user.email.trim().toLowerCase();
  return {
    id: randomUUID(),
    authUserId: user.id,
    email,
    displayName: "店主",
    isOwner: true,
    orderNotifications: true,
    viewStats: true,
    fulfillment: true,
    manageProducts: true,
    createdAt: now,
    updatedAt: now,
  };
}

export const resolveStaffAccess = cache(
  async (id: string, email: string): Promise<AdminSession> => {
    const user = { id, email: email.trim().toLowerCase() };
    const directory = await loadStaffDirectory();

    if (directory.staff.length === 0) {
      const owner = newOwnerRecord(user);
      try {
        await persistStaff(owner, directory.source, "insert");
      } catch (err) {
        console.warn("Failed to persist bootstrap owner:", err);
        const message = err instanceof Error ? err.message : "";
        if (message.includes("已是店员") || message.toLowerCase().includes("duplicate")) {
          const again = await loadStaffDirectory();
          const existing = findStaffForUser(again.staff, user);
          if (existing) return toAccess(user, existing);
        }
        if (directory.source === "supabase") {
          try {
            await persistStaff(owner, "local", "insert");
          } catch (localErr) {
            console.warn("Failed to persist bootstrap owner locally:", localErr);
          }
        }
      }
      return toAccess(user, owner);
    }

    const match = findStaffForUser(directory.staff, user);
    if (!match) return toAccess(user, null);

    if (!match.authUserId && user.id) {
      const linked: StaffRecord = {
        ...match,
        authUserId: user.id,
        updatedAt: new Date().toISOString(),
      };
      try {
        await persistStaff(linked, directory.source, "update");
        return toAccess(user, linked);
      } catch (err) {
        console.warn("Failed to link staff auth user:", err);
      }
    }

    return toAccess(user, match);
  },
);

export async function listNotificationRecipients(): Promise<StaffRecord[]> {
  const { staff } = await loadStaffDirectory();
  return staff.filter((member) => member.isOwner || member.orderNotifications);
}

async function findAuthUserByEmail(admin: AuthAdmin, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);

    const users = data?.users ?? [];
    const match = users.find((authUser) => authUser.email?.toLowerCase() === target);
    if (match) return match.id;
    if (users.length < 200) break;
  }

  return null;
}

async function resolveAuthUserId(
  email: string,
  explicitId: string | null,
): Promise<{ id: string | null; note: string }> {
  const admin = createAdminClient() as unknown as AuthAdmin;

  if (explicitId) {
    if (!isUuid(explicitId)) {
      throw new Error("Auth User UID 格式不正确");
    }
    const { data, error } = await admin.auth.admin.getUserById(explicitId);
    if (error || !data.user) {
      throw new Error("未找到该 Auth 用户，请核对 User UID");
    }
    return { id: data.user.id, note: "已关联指定登录账号" };
  }

  const existing = await findAuthUserByEmail(admin, email);
  if (existing) return { id: existing, note: "已关联现有登录账号" };

  const invited = await admin.auth.admin.inviteUserByEmail(email);
  if (invited.error || !invited.data?.user) {
    return {
      id: null,
      note: `未能发送邀请（${invited.error?.message ?? "未知错误"}）。请在 Supabase Authentication 创建该用户，或稍后填写 User UID。`,
    };
  }

  return { id: invited.data.user.id, note: "已发送 Supabase 邀请邮件" };
}

export async function createStaffMember(
  input: CreateStaffInput,
): Promise<{ ok: boolean; message: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "请填写有效邮箱" };
  }

  const directory = await loadStaffDirectory();
  if (directory.staff.some((member) => member.email === email)) {
    return { ok: false, message: "该邮箱已是店员" };
  }

  let authUserId = input.authUserId?.trim() || null;
  let note = "";

  if (directory.source === "supabase") {
    try {
      const resolved = await resolveAuthUserId(email, authUserId);
      authUserId = resolved.id;
      note = resolved.note;
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "无法关联登录账号" };
    }
  }

  if (authUserId && directory.staff.some((member) => member.authUserId === authUserId)) {
    return { ok: false, message: "该登录账号已绑定其他店员" };
  }

  const ownerCount = directory.staff.filter((member) => member.isOwner).length;
  const now = new Date().toISOString();
  const record: StaffRecord = {
    id: randomUUID(),
    authUserId,
    email,
    displayName: input.displayName.trim() || email,
    isOwner: input.isOwner || ownerCount === 0,
    orderNotifications: input.orderNotifications,
    viewStats: input.viewStats,
    fulfillment: input.fulfillment,
    manageProducts: input.manageProducts,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await persistStaff(record, directory.source, "insert");
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "保存店员失败" };
  }

  return { ok: true, message: note ? `已添加店员。${note}` : "已添加店员" };
}

export async function updateStaffMember(
  id: string,
  input: StaffWriteInput,
): Promise<{ ok: boolean; message: string }> {
  const directory = await loadStaffDirectory();
  const existing = directory.staff.find((member) => member.id === id);
  if (!existing) return { ok: false, message: "未找到该店员" };

  const owners = directory.staff.filter((member) => member.isOwner);
  if (existing.isOwner && !input.isOwner && owners.length <= 1) {
    return { ok: false, message: "至少需要保留一名店主" };
  }

  let authUserId = input.authUserId?.trim() || null;
  if (directory.source === "supabase" && authUserId) {
    try {
      const resolved = await resolveAuthUserId(existing.email, authUserId);
      authUserId = resolved.id;
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "无法关联登录账号" };
    }
  }

  if (authUserId && directory.staff.some((member) => member.id !== id && member.authUserId === authUserId)) {
    return { ok: false, message: "该登录账号已绑定其他店员" };
  }

  const updated: StaffRecord = {
    ...existing,
    displayName: input.displayName.trim() || existing.email,
    authUserId,
    isOwner: input.isOwner,
    orderNotifications: input.orderNotifications,
    viewStats: input.viewStats,
    fulfillment: input.fulfillment,
    manageProducts: input.manageProducts,
    updatedAt: new Date().toISOString(),
  };

  try {
    await persistStaff(updated, directory.source, "update");
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "保存店员失败" };
  }

  return { ok: true, message: "店员权限已保存" };
}

export async function deleteStaffMember(
  id: string,
  actor: { id: string; email: string },
): Promise<{ ok: boolean; message: string }> {
  const directory = await loadStaffDirectory();
  const existing = directory.staff.find((member) => member.id === id);
  if (!existing) return { ok: false, message: "未找到该店员" };

  const actorEmail = actor.email.trim().toLowerCase();
  if (existing.authUserId === actor.id || existing.email === actorEmail) {
    return { ok: false, message: "不能删除当前登录账号" };
  }

  const owners = directory.staff.filter((member) => member.isOwner);
  if (existing.isOwner && owners.length <= 1) {
    return { ok: false, message: "不能删除最后一名店主" };
  }

  try {
    await deletePersistedStaff(id, directory.source);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "删除店员失败" };
  }

  return { ok: true, message: "已删除店员" };
}
