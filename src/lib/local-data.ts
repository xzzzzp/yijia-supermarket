import "server-only";

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { AuditLogRecord } from "@/types/audit";
import type { OrderNotificationRecord } from "@/types/notification";
import type { OrderRecord, OrderStatus } from "@/types/order";
import type { StaffRecord } from "@/types/staff";
import type { StoreSettings } from "@/types/settings";
import { mergeStoreSettings } from "@/lib/store-settings-defaults";
import { normalizeOrderRecord } from "@/lib/order-stats";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const STAFF_FILE = path.join(DATA_DIR, "staff.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit-logs.json");

export async function readLocalSettings(): Promise<StoreSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreSettings>;
    return mergeStoreSettings(parsed);
  } catch {
    return mergeStoreSettings(null);
  }
}

export async function writeLocalSettings(settings: StoreSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function readLocalOrders(): Promise<OrderRecord[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<OrderRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((order) =>
      normalizeOrderRecord({
        id: order.id!,
        channel: order.channel!,
        status: order.status,
        items: order.items ?? [],
        total: order.total ?? 0,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        note: order.note,
        orderText: order.orderText ?? "",
        createdAt: order.createdAt ?? new Date().toISOString(),
        completedAt: order.completedAt,
        requestToken: order.requestToken,
      }),
    );
  } catch {
    return [];
  }
}

export async function appendLocalOrder(
  order: Omit<OrderRecord, "id" | "createdAt" | "status" | "completedAt">,
): Promise<{ id: string; created: boolean }> {
  const orders = await readLocalOrders();
  const token = order.requestToken?.trim();
  if (token) {
    const existing = orders.find((item) => item.requestToken === token);
    if (existing) return { id: existing.id, created: false };
  }

  const id = randomUUID();
  const record: OrderRecord = normalizeOrderRecord({
    ...order,
    id,
    requestToken: token || null,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
  orders.unshift(record);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return { id, created: true };
}

export async function updateLocalOrderStatus(
  orderId: string,
  status: OrderStatus,
  completedAt: string | null,
  expectedStatus?: OrderStatus,
): Promise<"updated" | "missing" | "conflict"> {
  const orders = await readLocalOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) return "missing";
  if (expectedStatus && orders[index].status !== expectedStatus) return "conflict";

  orders[index] = normalizeOrderRecord({
    ...orders[index],
    status,
    completedAt: status === "completed" ? completedAt : null,
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return "updated";
}

function normalizeStaffRecord(row: Partial<StaffRecord>): StaffRecord | null {
  if (!row.id || !row.email) return null;
  const now = new Date().toISOString();
  return {
    id: row.id,
    authUserId: row.authUserId ?? null,
    email: row.email.trim().toLowerCase(),
    displayName: row.displayName?.trim() || row.email,
    isOwner: Boolean(row.isOwner),
    orderNotifications: Boolean(row.orderNotifications),
    viewStats: Boolean(row.viewStats),
    fulfillment: Boolean(row.fulfillment),
    manageProducts: Boolean(row.manageProducts),
    createdAt: row.createdAt ?? now,
    updatedAt: row.updatedAt ?? now,
  };
}

export async function readLocalStaff(): Promise<StaffRecord[]> {
  try {
    const raw = await fs.readFile(STAFF_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StaffRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      const staff = normalizeStaffRecord(row);
      return staff ? [staff] : [];
    });
  } catch {
    return [];
  }
}

export async function writeLocalStaff(staff: StaffRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STAFF_FILE, JSON.stringify(staff, null, 2));
}

function notificationKey(record: Pick<OrderNotificationRecord, "orderId" | "recipientStaffId" | "channel">): string {
  return `${record.orderId}:${record.recipientStaffId}:${record.channel}`;
}

function normalizeNotification(row: Partial<OrderNotificationRecord>): OrderNotificationRecord | null {
  if (!row.notificationId || !row.orderId || !row.recipientStaffId) return null;
  if (row.channel !== "in_app") return null;
  return {
    notificationId: row.notificationId,
    orderId: row.orderId,
    recipientStaffId: row.recipientStaffId,
    channel: "in_app",
    createdAt: row.createdAt ?? new Date().toISOString(),
    readAt: row.readAt ?? null,
  };
}

export async function readLocalNotifications(): Promise<OrderNotificationRecord[]> {
  try {
    const raw = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<OrderNotificationRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      const record = normalizeNotification(row);
      return record ? [record] : [];
    });
  } catch {
    return [];
  }
}

async function writeLocalNotifications(records: OrderNotificationRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(records, null, 2));
}

export async function appendLocalNotifications(records: OrderNotificationRecord[]): Promise<number> {
  if (!records.length) return 0;
  const existing = await readLocalNotifications();
  const keys = new Set(existing.map(notificationKey));
  let added = 0;

  for (const record of records) {
    const normalized = normalizeNotification(record);
    if (!normalized) continue;
    const key = notificationKey(normalized);
    if (keys.has(key)) continue;
    existing.unshift(normalized);
    keys.add(key);
    added += 1;
  }

  if (added > 0) await writeLocalNotifications(existing);
  return added;
}

export async function markLocalNotificationRead(
  notificationId: string,
  recipientStaffId: string,
  readAt: string,
): Promise<"updated" | "already" | "missing"> {
  const records = await readLocalNotifications();
  const index = records.findIndex(
    (record) => record.notificationId === notificationId && record.recipientStaffId === recipientStaffId,
  );
  if (index === -1) return "missing";
  if (records[index].readAt) return "already";
  records[index] = { ...records[index], readAt };
  await writeLocalNotifications(records);
  return "updated";
}

export async function markAllLocalNotificationsRead(recipientStaffId: string, readAt: string): Promise<number> {
  const records = await readLocalNotifications();
  let updated = 0;
  const next = records.map((record) => {
    if (record.recipientStaffId !== recipientStaffId || record.channel !== "in_app" || record.readAt) {
      return record;
    }
    updated += 1;
    return { ...record, readAt };
  });
  if (updated > 0) await writeLocalNotifications(next);
  return updated;
}

function normalizeAudit(row: Partial<AuditLogRecord>): AuditLogRecord | null {
  if (!row.id || !row.actorEmail || !row.action || !row.targetType || !row.summary) return null;
  return {
    id: row.id,
    createdAt: row.createdAt ?? new Date().toISOString(),
    actorEmail: row.actorEmail,
    actorStaffId: row.actorStaffId ?? null,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId ?? null,
    summary: row.summary,
    ip: row.ip ?? null,
  };
}

export async function readLocalAuditLogs(): Promise<AuditLogRecord[]> {
  try {
    const raw = await fs.readFile(AUDIT_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AuditLogRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      const record = normalizeAudit(row);
      return record ? [record] : [];
    });
  } catch {
    return [];
  }
}

export async function appendLocalAuditLog(record: AuditLogRecord): Promise<void> {
  const logs = await readLocalAuditLogs();
  logs.unshift(record);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(AUDIT_FILE, JSON.stringify(logs.slice(0, 500), null, 2));
}
