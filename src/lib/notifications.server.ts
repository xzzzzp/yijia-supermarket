import "server-only";

import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2";
import {
  appendLocalNotifications,
  markAllLocalNotificationsRead,
  markLocalNotificationRead,
  readLocalNotifications,
  readLocalOrders,
} from "@/lib/local-data";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import type { InAppHintSnapshot } from "@/lib/notification-hint";
import { IN_APP_CHANNEL } from "@/types/notification";
import type { OrderNotificationRecord, OrderNotificationView } from "@/types/notification";

const SCHEMA_HINT =
  "站内通知表尚未建立。请在 MySQL 中执行 mysql/migrations/20261018_notifications_and_audit.sql，或重新执行 mysql/schema.sql。";

interface NotificationRow extends RowDataPacket {
  notification_id: string;
  order_id: string;
  recipient_staff_id: string;
  channel: string;
  created_at: Date | string;
  read_at: Date | string | null;
  customer_name: string | null;
}

interface CountRow extends RowDataPacket {
  total: number | string;
}

interface NewestNotificationRow extends RowDataPacket {
  notification_id: string;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function uniqueStaffIds(staffIds: string[]): string[] {
  return [...new Set(staffIds.map((id) => id.trim()).filter(Boolean))];
}

export async function insertInAppOrderNotifications(orderId: string, staffIds: string[]): Promise<number> {
  const recipients = uniqueStaffIds(staffIds);
  if (!orderId || !recipients.length) return 0;

  const now = new Date();
  const records: OrderNotificationRecord[] = recipients.map((recipientStaffId) => ({
    notificationId: randomUUID(),
    orderId,
    recipientStaffId,
    channel: IN_APP_CHANNEL,
    createdAt: now.toISOString(),
    readAt: null,
  }));

  if (!isMysqlConfigured()) {
    return appendLocalNotifications(records);
  }

  const placeholders = records.map(() => "(?, ?, ?, ?, ?, NULL)").join(", ");
  const params: unknown[] = [];
  for (const record of records) {
    params.push(record.notificationId, record.orderId, record.recipientStaffId, IN_APP_CHANNEL, now);
  }

  const result = await mysqlExecute(
    `INSERT IGNORE INTO order_notifications (
       notification_id, order_id, recipient_staff_id, channel, created_at, read_at
     ) VALUES ${placeholders}`,
    params,
  );
  return result.affectedRows;
}

export async function countUnreadNotifications(staffId: string | null): Promise<number> {
  if (!staffId) return 0;
  const hint = await getInAppNotificationHint(staffId);
  return hint?.unreadCount ?? 0;
}

function newestLocalNotification(records: OrderNotificationRecord[]): OrderNotificationRecord | null {
  return records.reduce<OrderNotificationRecord | null>((best, record) => {
    if (!best || record.createdAt > best.createdAt) return record;
    if (record.createdAt === best.createdAt && record.notificationId > best.notificationId) return record;
    return best;
  }, null);
}

/** 铃铛未读数，以及最新一条站内通知。失败时返回 null，调用方保持上一轮画面。 */
export async function getInAppNotificationHint(staffId: string | null): Promise<InAppHintSnapshot | null> {
  if (!staffId) return { unreadCount: 0, newestNotificationId: null };

  try {
    if (!isMysqlConfigured()) {
      const records = (await readLocalNotifications()).filter(
        (record) => record.recipientStaffId === staffId && record.channel === IN_APP_CHANNEL,
      );
      return {
        unreadCount: records.filter((record) => !record.readAt).length,
        newestNotificationId: newestLocalNotification(records)?.notificationId ?? null,
      };
    }

    const [countRows, newestRows] = await Promise.all([
      mysqlQuery<CountRow[]>(
        `SELECT COUNT(*) AS total
         FROM order_notifications
         WHERE recipient_staff_id = ? AND channel = ? AND read_at IS NULL`,
        [staffId, IN_APP_CHANNEL],
      ),
      mysqlQuery<NewestNotificationRow[]>(
        `SELECT notification_id
         FROM order_notifications
         WHERE recipient_staff_id = ? AND channel = ?
         ORDER BY created_at DESC, notification_id DESC
         LIMIT 1`,
        [staffId, IN_APP_CHANNEL],
      ),
    ]);

    return {
      unreadCount: Number(countRows[0]?.total ?? 0),
      newestNotificationId: newestRows[0]?.notification_id ?? null,
    };
  } catch (err) {
    console.warn("[order-notifications] hint failed:", err);
    return null;
  }
}

export async function listInAppNotifications(
  staffId: string,
): Promise<{ notifications: OrderNotificationView[]; warning?: string }> {
  try {
    if (!isMysqlConfigured()) {
      const [records, orders] = await Promise.all([readLocalNotifications(), readLocalOrders()]);
      const customers = new Map(orders.map((order) => [order.id, order.customerName ?? null]));
      const notifications = records
        .filter((record) => record.recipientStaffId === staffId && record.channel === IN_APP_CHANNEL)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 200)
        .map((record) => ({
          ...record,
          customerName: customers.get(record.orderId) ?? null,
        }));
      return { notifications };
    }

    const rows = await mysqlQuery<NotificationRow[]>(
      `SELECT n.notification_id, n.order_id, n.recipient_staff_id, n.channel, n.created_at, n.read_at,
              o.customer_name
       FROM order_notifications n
       LEFT JOIN orders o ON o.id = n.order_id
       WHERE n.recipient_staff_id = ? AND n.channel = ?
       ORDER BY n.created_at DESC
       LIMIT 200`,
      [staffId, IN_APP_CHANNEL],
    );

    return {
      notifications: rows.flatMap((row) => {
        if (row.channel !== IN_APP_CHANNEL) return [];
        return [
          {
            notificationId: row.notification_id,
            orderId: row.order_id,
            recipientStaffId: row.recipient_staff_id,
            channel: IN_APP_CHANNEL,
            createdAt: toIso(row.created_at) ?? new Date().toISOString(),
            readAt: toIso(row.read_at),
            customerName: row.customer_name,
          },
        ];
      }),
    };
  } catch (err) {
    console.error("Failed to list in-app notifications:", err);
    return { notifications: [], warning: SCHEMA_HINT };
  }
}

export async function markInAppNotificationRead(
  notificationId: string,
  staffId: string,
): Promise<{ ok: boolean; message: string }> {
  const readAt = new Date();

  try {
    if (!isMysqlConfigured()) {
      const result = await markLocalNotificationRead(notificationId, staffId, readAt.toISOString());
      if (result === "missing") return { ok: false, message: "未找到该通知" };
      return { ok: true, message: result === "already" ? "这条通知已经读过" : "已标为已读" };
    }

    const result = await mysqlExecute(
      `UPDATE order_notifications
       SET read_at = ?
       WHERE notification_id = ? AND recipient_staff_id = ? AND channel = ? AND read_at IS NULL`,
      [readAt, notificationId, staffId, IN_APP_CHANNEL],
    );
    if (result.affectedRows > 0) return { ok: true, message: "已标为已读" };

    const existing = await mysqlQuery<NotificationRow[]>(
      `SELECT notification_id, order_id, recipient_staff_id, channel, created_at, read_at, NULL AS customer_name
       FROM order_notifications
       WHERE notification_id = ? AND recipient_staff_id = ? AND channel = ?
       LIMIT 1`,
      [notificationId, staffId, IN_APP_CHANNEL],
    );
    if (!existing.length) return { ok: false, message: "未找到该通知" };
    return { ok: true, message: "这条通知已经读过" };
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    return { ok: false, message: SCHEMA_HINT };
  }
}

export async function markAllInAppNotificationsRead(staffId: string): Promise<{ ok: boolean; message: string }> {
  const readAt = new Date();

  try {
    if (!isMysqlConfigured()) {
      const updated = await markAllLocalNotificationsRead(staffId, readAt.toISOString());
      return { ok: true, message: updated > 0 ? `已将 ${updated} 条标为已读` : "没有未读通知" };
    }

    const result = await mysqlExecute(
      `UPDATE order_notifications
       SET read_at = ?
       WHERE recipient_staff_id = ? AND channel = ? AND read_at IS NULL`,
      [readAt, staffId, IN_APP_CHANNEL],
    );
    return {
      ok: true,
      message: result.affectedRows > 0 ? `已将 ${result.affectedRows} 条标为已读` : "没有未读通知",
    };
  } catch (err) {
    console.error("Failed to mark notifications read:", err);
    return { ok: false, message: SCHEMA_HINT };
  }
}
