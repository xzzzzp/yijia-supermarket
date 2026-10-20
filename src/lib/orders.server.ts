import "server-only";

import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2";
import { appendLocalOrder, readLocalOrders, updateLocalOrderStatus } from "@/lib/local-data";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { dispatchNewOrderNotification } from "@/lib/order-notifications";
import {
  isAdjacentOrderStatus,
  isOrderStatus,
  ORDER_STATUS_LABELS,
  RETIRED_AWAITING_REMITTANCE_STATUS,
} from "@/lib/order-status";
import { normalizeOrderRecord } from "@/lib/order-stats";
import type { OrderChannel, OrderItem, OrderRecord, OrderStatus } from "@/types/order";

interface SaveOrderInput {
  channel: OrderChannel;
  items: OrderItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  orderText: string;
  requestToken: string;
}

interface OrderRow extends RowDataPacket {
  id: string;
  channel: OrderChannel;
  status: OrderStatus | null;
  items: OrderItem[] | string;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  note: string | null;
  order_text: string;
  created_at: Date | string;
  completed_at: Date | string | null;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function parseItems(value: OrderItem[] | string): OrderItem[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as OrderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface TokenOrderRow extends RowDataPacket {
  id: string;
  order_text: string;
}

function isDuplicateEntry(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ER_DUP_ENTRY";
}

async function findMysqlOrderByToken(token: string): Promise<{ id: string; orderText: string } | null> {
  const rows = await mysqlQuery<TokenOrderRow[]>(
    "SELECT id, order_text FROM orders WHERE request_token = ? LIMIT 1",
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, orderText: row.order_text };
}

function rowToOrderRecord(row: OrderRow): OrderRecord {
  return normalizeOrderRecord({
    id: row.id,
    channel: row.channel,
    status: row.status ?? "pending",
    items: parseItems(row.items),
    total: Number(row.total),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    note: row.note,
    orderText: row.order_text,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    completedAt: toIso(row.completed_at),
  });
}

export async function saveOrderRecord(input: SaveOrderInput): Promise<{ id: string; orderText: string }> {
  const requestToken = input.requestToken.trim();
  if (!requestToken) {
    throw new Error("订单请求标识无效");
  }

  if (isMysqlConfigured()) {
    const existing = await findMysqlOrderByToken(requestToken);
    if (existing) return existing;

    const id = randomUUID();
    try {
      await mysqlExecute(
        `INSERT INTO orders (
           id, channel, status, items, total, customer_name, customer_phone,
           customer_address, note, order_text, request_token
         ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.channel,
          JSON.stringify(input.items),
          input.total,
          input.customerName ?? null,
          input.customerPhone ?? null,
          input.customerAddress ?? null,
          input.note ?? null,
          input.orderText,
          requestToken,
        ],
      );
    } catch (err) {
      if (isDuplicateEntry(err)) {
        const again = await findMysqlOrderByToken(requestToken);
        if (again) return again;
      }
      throw err;
    }

    await dispatchNewOrderNotification(id);
    return { id, orderText: input.orderText };
  }

  const existingLocal = (await readLocalOrders()).find((order) => order.requestToken === requestToken);
  if (existingLocal) {
    return { id: existingLocal.id, orderText: existingLocal.orderText };
  }

  const saved = await appendLocalOrder({
    channel: input.channel,
    items: input.items,
    total: input.total,
    customerName: input.customerName ?? null,
    customerPhone: input.customerPhone ?? null,
    customerAddress: input.customerAddress ?? null,
    note: input.note ?? null,
    orderText: input.orderText,
    requestToken,
  });
  if (!saved.created) {
    const again = (await readLocalOrders()).find((order) => order.id === saved.id);
    return { id: saved.id, orderText: again?.orderText ?? input.orderText };
  }

  await dispatchNewOrderNotification(saved.id);
  return { id: saved.id, orderText: input.orderText };
}

export async function fetchOrderRecords(): Promise<OrderRecord[]> {
  if (isMysqlConfigured()) {
    const rows = await mysqlQuery<OrderRow[]>(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    return rows.map(rowToOrderRecord);
  }

  return readLocalOrders();
}

function statusUpdateMessage(status: OrderStatus): string {
  return `订单已更新为「${ORDER_STATUS_LABELS[status]}」`;
}

export async function transitionOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: boolean; message: string; fromStatus?: OrderStatus }> {
  if (!isOrderStatus(status)) {
    return { ok: false, message: "无效的订单状态" };
  }

  const orders = await fetchOrderRecords();
  const current = orders.find((order) => order.id === orderId);
  if (!current) {
    return { ok: false, message: "未找到该订单" };
  }

  if (!isAdjacentOrderStatus(current.status, status)) {
    return { ok: false, message: "只能按履约顺序前进或退回一步" };
  }

  const result = await updateOrderStatus(orderId, status, current.status);
  if (!result.ok) return result;
  return { ...result, fromStatus: current.status };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  expectedStatus?: OrderStatus,
): Promise<{ ok: boolean; message: string }> {
  const completedAt = status === "completed" ? new Date() : null;

  if (isMysqlConfigured()) {
    try {
      const result = await mysqlExecute(
        expectedStatus
          ? "UPDATE orders SET status = ?, completed_at = ? WHERE id = ? AND status = ?"
          : "UPDATE orders SET status = ?, completed_at = ? WHERE id = ?",
        expectedStatus
          ? [status, completedAt, orderId, expectedStatus]
          : [status, completedAt, orderId],
      );
      if (result.affectedRows > 0) {
        return { ok: true, message: statusUpdateMessage(status) };
      }

      const existing = await mysqlQuery<(RowDataPacket & { status: string | null })[]>(
        "SELECT id, status FROM orders WHERE id = ? LIMIT 1",
        [orderId],
      );
      if (!existing.length) {
        return { ok: false, message: "未找到该订单" };
      }
      if (existing[0]?.status === RETIRED_AWAITING_REMITTANCE_STATUS) {
        return {
          ok: false,
          message:
            "该订单仍是已下线的「已收款待回款」。请先执行 mysql/migrations/20261020_drop_awaiting_remittance.sql，再刷新后操作。",
        };
      }
      return { ok: false, message: "订单状态已变化，请刷新后再操作" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("orders_status_chk") || message.includes("Check constraint")) {
        return {
          ok: false,
          message:
            "订单状态不被数据库接受。请先执行 mysql/migrations/20261020_drop_awaiting_remittance.sql，或在新库执行 mysql/schema.sql。",
        };
      }
      console.error("Failed to update order in MySQL:", err);
      return { ok: false, message: "订单状态没有写入 MySQL" };
    }
  }

  const updated = await updateLocalOrderStatus(
    orderId,
    status,
    completedAt ? completedAt.toISOString() : null,
    expectedStatus,
  );
  if (updated === "missing") {
    return { ok: false, message: "未找到该订单" };
  }
  if (updated === "conflict") {
    return { ok: false, message: "订单状态已变化，请刷新后再操作" };
  }

  return { ok: true, message: statusUpdateMessage(status) };
}
