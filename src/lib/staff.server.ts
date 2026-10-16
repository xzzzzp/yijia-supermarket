import "server-only";

import { randomUUID } from "crypto";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { verifyDevCredentials } from "@/lib/dev-auth";
import { readLocalStaff, writeLocalStaff } from "@/lib/local-data";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { hashPassword, MIN_STAFF_PASSWORD_LENGTH, verifyPassword } from "@/lib/passwords";
import { capabilitiesFor } from "@/lib/staff-access";
import type { AdminSession, StaffDirectory, StaffRecord } from "@/types/staff";

interface StaffRow extends RowDataPacket {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  is_owner: number;
  order_notifications: number;
  view_stats: number;
  fulfillment: number;
  manage_products: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface StaffWriteInput {
  displayName: string;
  isOwner: boolean;
  orderNotifications: boolean;
  viewStats: boolean;
  fulfillment: boolean;
  manageProducts: boolean;
  password?: string;
}

export interface CreateStaffInput extends StaffWriteInput {
  email: string;
}

export type LoginFailure = "invalid" | "db" | "session";

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function bit(value: boolean): number {
  return value ? 1 : 0;
}

function isDup(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ER_DUP_ENTRY";
}

function rowToStaff(row: StaffRow): StaffRecord {
  return {
    id: row.id,
    authUserId: null,
    email: row.email.trim().toLowerCase(),
    displayName: row.display_name?.trim() || row.email,
    isOwner: Boolean(row.is_owner),
    orderNotifications: Boolean(row.order_notifications),
    viewStats: Boolean(row.view_stats),
    fulfillment: Boolean(row.fulfillment),
    manageProducts: Boolean(row.manage_products),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toAccess(staff: StaffRecord): AdminSession {
  return {
    id: staff.id,
    email: staff.email,
    staffId: staff.id,
    isOwner: staff.isOwner,
    capabilities: capabilitiesFor(staff),
  };
}

function devOwnerEmail(): string | null {
  return process.env.ADMIN_DEV_EMAIL?.trim().toLowerCase() || null;
}

function passwordError(password: string | undefined, required: boolean): string | null {
  const value = password?.trim() ?? "";
  if (!value) return required ? "请设置登录密码" : null;
  if (value.length < MIN_STAFF_PASSWORD_LENGTH) {
    return `登录密码至少 ${MIN_STAFF_PASSWORD_LENGTH} 位`;
  }
  return null;
}

async function readMysqlStaff(): Promise<StaffRecord[]> {
  const rows = await mysqlQuery<StaffRow[]>(
    `SELECT id, email, display_name, password_hash, is_owner, order_notifications,
            view_stats, fulfillment, manage_products, created_at, updated_at
     FROM staff
     ORDER BY created_at ASC`,
  );
  return rows.map(rowToStaff);
}

async function readMysqlAuthRows(): Promise<StaffRow[]> {
  return mysqlQuery<StaffRow[]>(
    `SELECT id, email, display_name, password_hash, is_owner, order_notifications,
            view_stats, fulfillment, manage_products, created_at, updated_at
     FROM staff
     ORDER BY created_at ASC`,
  );
}

export async function loadStaffDirectory(): Promise<StaffDirectory> {
  if (isMysqlConfigured()) {
    try {
      return { source: "mysql", staff: await readMysqlStaff() };
    } catch (err) {
      console.error("Failed to read staff from MySQL:", err);
      return {
        source: "mysql",
        staff: [],
        unavailable: true,
        warning: "无法读取 MySQL 店员表。已拒绝改用本地数据，避免把当前账号当成店主。",
      };
    }
  }

  return { source: "local", staff: await readLocalStaff() };
}

function newLocalOwner(email: string): StaffRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    authUserId: "dev-admin",
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

async function ensureLocalDevOwner(email: string): Promise<StaffRecord> {
  const staff = await readLocalStaff();
  const existing = staff.find(
    (member) => member.email === email || member.authUserId === "dev-admin",
  );
  if (existing) return existing;
  if (staff.length > 0) {
    throw new Error("当前开发账号不在店员列表中");
  }

  const owner = newLocalOwner(email);
  await writeLocalStaff([owner]);
  const saved = (await readLocalStaff()).find((member) => member.id === owner.id);
  if (!saved) {
    throw new Error("店主记录没有写入 data/staff.json");
  }
  return saved;
}

async function insertMysqlOwner(email: string, password: string): Promise<StaffRecord> {
  const now = new Date();
  const record: StaffRecord = {
    id: randomUUID(),
    authUserId: null,
    email,
    displayName: "店主",
    isOwner: true,
    orderNotifications: true,
    viewStats: true,
    fulfillment: true,
    manageProducts: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await mysqlExecute(
    `INSERT INTO staff (
       id, email, display_name, password_hash, is_owner,
       order_notifications, view_stats, fulfillment, manage_products,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, ?, ?)`,
    [record.id, email, record.displayName, hashPassword(password), now, now],
  );

  const saved = (await readMysqlStaff()).find((member) => member.id === record.id);
  if (!saved) {
    throw new Error("店主记录没有写入 MySQL");
  }
  return saved;
}

export async function loginStaff(
  email: string,
  password: string,
): Promise<{ ok: true; staffId: string; email: string } | { ok: false; error: LoginFailure }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return { ok: false, error: "invalid" };

  if (!isMysqlConfigured()) {
    if (!verifyDevCredentials(email, password)) return { ok: false, error: "invalid" };
    try {
      const owner = await ensureLocalDevOwner(normalized);
      return { ok: true, staffId: owner.id, email: owner.email };
    } catch (err) {
      console.error("Failed to persist local owner:", err);
      return { ok: false, error: "db" };
    }
  }

  let rows: StaffRow[];
  try {
    rows = await readMysqlAuthRows();
  } catch (err) {
    console.error("Failed to read staff while logging in:", err);
    return { ok: false, error: "db" };
  }

  if (rows.length === 0) {
    const ownerEmail = devOwnerEmail();
    const ownerPassword = process.env.ADMIN_DEV_PASSWORD;
    if (!ownerEmail || !ownerPassword || normalized !== ownerEmail || password !== ownerPassword) {
      return { ok: false, error: "invalid" };
    }
    try {
      const owner = await insertMysqlOwner(normalized, password);
      return { ok: true, staffId: owner.id, email: owner.email };
    } catch (err) {
      console.error("Failed to create first owner:", err);
      try {
        const again = await readMysqlAuthRows();
        const existing = again.find((row) => row.email.trim().toLowerCase() === normalized);
        if (existing && verifyPassword(password, existing.password_hash)) {
          return { ok: true, staffId: existing.id, email: existing.email };
        }
      } catch (readErr) {
        console.error("Failed to re-read staff after owner insert:", readErr);
      }
      return { ok: false, error: "db" };
    }
  }

  const match = rows.find((row) => row.email.trim().toLowerCase() === normalized);
  if (!match || !verifyPassword(password, match.password_hash)) {
    return { ok: false, error: "invalid" };
  }
  return { ok: true, staffId: match.id, email: match.email.trim().toLowerCase() };
}

export const resolveStaffAccess = cache(async (staffId: string, email: string): Promise<AdminSession | null> => {
  const directory = await loadStaffDirectory();
  if (directory.unavailable) {
    redirect("/admin/login?error=db");
  }

  const normalized = email.trim().toLowerCase();
  const match =
    directory.staff.find((member) => member.id === staffId) ??
    directory.staff.find((member) => member.email === normalized) ??
    directory.staff.find((member) => member.authUserId && member.authUserId === staffId);

  if (!match) return null;
  return toAccess(match);
});

export async function listNotificationRecipients(): Promise<StaffRecord[]> {
  const directory = await loadStaffDirectory();
  if (directory.unavailable) return [];
  return directory.staff.filter((member) => member.isOwner || member.orderNotifications);
}

export async function createStaffMember(
  input: CreateStaffInput,
): Promise<{ ok: boolean; message: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "请填写有效邮箱" };
  }

  const directory = await loadStaffDirectory();
  if (directory.unavailable) {
    return { ok: false, message: directory.warning ?? "无法读取店员表" };
  }
  if (directory.staff.some((member) => member.email === email)) {
    return { ok: false, message: "该邮箱已是店员" };
  }

  const passwordProblem = passwordError(input.password, directory.source === "mysql");
  if (passwordProblem) return { ok: false, message: passwordProblem };

  const ownerCount = directory.staff.filter((member) => member.isOwner).length;
  const now = new Date();
  const record: StaffRecord = {
    id: randomUUID(),
    authUserId: null,
    email,
    displayName: input.displayName.trim() || email,
    isOwner: input.isOwner || ownerCount === 0,
    orderNotifications: input.orderNotifications,
    viewStats: input.viewStats,
    fulfillment: input.fulfillment,
    manageProducts: input.manageProducts,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    if (directory.source === "mysql") {
      await mysqlExecute(
        `INSERT INTO staff (
           id, email, display_name, password_hash, is_owner,
           order_notifications, view_stats, fulfillment, manage_products,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.email,
          record.displayName,
          hashPassword(input.password!.trim()),
          bit(record.isOwner),
          bit(record.orderNotifications),
          bit(record.viewStats),
          bit(record.fulfillment),
          bit(record.manageProducts),
          now,
          now,
        ],
      );
    } else {
      const staff = await readLocalStaff();
      staff.push(record);
      await writeLocalStaff(staff);
    }
  } catch (err) {
    if (isDup(err)) return { ok: false, message: "该邮箱已是店员" };
    return { ok: false, message: err instanceof Error ? err.message : "保存店员失败" };
  }

  return { ok: true, message: "已添加店员" };
}

export async function updateStaffMember(
  id: string,
  input: StaffWriteInput,
): Promise<{ ok: boolean; message: string }> {
  const directory = await loadStaffDirectory();
  if (directory.unavailable) {
    return { ok: false, message: directory.warning ?? "无法读取店员表" };
  }

  const existing = directory.staff.find((member) => member.id === id);
  if (!existing) return { ok: false, message: "未找到该店员" };

  const owners = directory.staff.filter((member) => member.isOwner);
  if (existing.isOwner && !input.isOwner && owners.length <= 1) {
    return { ok: false, message: "至少需要保留一名店主" };
  }

  const passwordProblem = passwordError(input.password, false);
  if (passwordProblem) return { ok: false, message: passwordProblem };

  const now = new Date();
  const updated: StaffRecord = {
    ...existing,
    displayName: input.displayName.trim() || existing.email,
    isOwner: input.isOwner,
    orderNotifications: input.orderNotifications,
    viewStats: input.viewStats,
    fulfillment: input.fulfillment,
    manageProducts: input.manageProducts,
    updatedAt: now.toISOString(),
  };

  try {
    if (directory.source === "mysql") {
      const password = input.password?.trim();
      if (password) {
        await mysqlExecute(
          `UPDATE staff
           SET display_name = ?, is_owner = ?, order_notifications = ?, view_stats = ?,
               fulfillment = ?, manage_products = ?, password_hash = ?, updated_at = ?
           WHERE id = ?`,
          [
            updated.displayName,
            bit(updated.isOwner),
            bit(updated.orderNotifications),
            bit(updated.viewStats),
            bit(updated.fulfillment),
            bit(updated.manageProducts),
            hashPassword(password),
            now,
            id,
          ],
        );
      } else {
        await mysqlExecute(
          `UPDATE staff
           SET display_name = ?, is_owner = ?, order_notifications = ?, view_stats = ?,
               fulfillment = ?, manage_products = ?, updated_at = ?
           WHERE id = ?`,
          [
            updated.displayName,
            bit(updated.isOwner),
            bit(updated.orderNotifications),
            bit(updated.viewStats),
            bit(updated.fulfillment),
            bit(updated.manageProducts),
            now,
            id,
          ],
        );
      }
    } else {
      const staff = await readLocalStaff();
      const index = staff.findIndex((member) => member.id === id);
      if (index === -1) return { ok: false, message: "未找到该店员" };
      staff[index] = updated;
      await writeLocalStaff(staff);
    }
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
  if (directory.unavailable) {
    return { ok: false, message: directory.warning ?? "无法读取店员表" };
  }

  const existing = directory.staff.find((member) => member.id === id);
  if (!existing) return { ok: false, message: "未找到该店员" };

  const actorEmail = actor.email.trim().toLowerCase();
  if (existing.id === actor.id || existing.email === actorEmail) {
    return { ok: false, message: "不能删除当前登录账号" };
  }

  const owners = directory.staff.filter((member) => member.isOwner);
  if (existing.isOwner && owners.length <= 1) {
    return { ok: false, message: "不能删除最后一名店主" };
  }

  try {
    if (directory.source === "mysql") {
      await mysqlExecute("DELETE FROM staff WHERE id = ?", [id]);
    } else {
      const staff = await readLocalStaff();
      await writeLocalStaff(staff.filter((member) => member.id !== id));
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "删除店员失败" };
  }

  return { ok: true, message: "已删除店员" };
}
