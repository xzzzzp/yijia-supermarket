import "server-only";

import { randomUUID } from "crypto";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { appendLocalOrder, readLocalOrders, updateLocalOrderStatus } from "@/lib/local-data";
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

function rowToOrderRecord(row: {
  id: string;
  channel: OrderChannel;
  status?: OrderStatus | null;
  items: OrderItem[];
  total: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  note?: string | null;
  order_text: string;
  created_at: string;
  completed_at?: string | null;
}): OrderRecord {
  return normalizeOrderRecord({
    id: row.id,
    channel: row.channel,
    status: row.status ?? "pending",
    items: row.items,
    total: row.total,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    note: row.note,
    orderText: row.order_text,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
}

export async function saveOrderRecord(input: SaveOrderInput): Promise<string> {
  if (hasSupabaseAdmin()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("orders")
        .insert({
          channel: input.channel,
          status: "pending",
          items: input.items,
          total: input.total,
          customer_name: input.customerName,
          customer_phone: input.customerPhone,
          customer_address: input.customerAddress,
          note: input.note,
          order_text: input.orderText,
          request_token: input.requestToken,
        })
        .select("id")
        .single();

      if (!error && data?.id) {
        return data.id;
      }

      console.warn("Failed to save order to Supabase:", error?.message);
    } catch (err) {
      console.warn("Failed to save order to Supabase:", err);
    }
  }

  try {
    return await appendLocalOrder({
      channel: input.channel,
      items: input.items,
      total: input.total,
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      customerAddress: input.customerAddress ?? null,
      note: input.note ?? null,
      orderText: input.orderText,
    });
  } catch (err) {
    console.warn("Failed to save order locally:", err);
    return randomUUID();
  }
}

export async function fetchOrderRecords(): Promise<OrderRecord[]> {
  if (hasSupabaseAdmin()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((row) =>
          rowToOrderRecord({
            id: row.id,
            channel: row.channel as OrderChannel,
            status: row.status as OrderStatus | null,
            items: row.items as OrderItem[],
            total: row.total,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            customer_address: row.customer_address,
            note: row.note,
            order_text: row.order_text,
            created_at: row.created_at,
            completed_at: row.completed_at,
          }),
        );
      }
    } catch (err) {
      console.warn("Failed to fetch orders from Supabase:", err);
    }
  }

  return readLocalOrders();
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: boolean; message: string }> {
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  if (hasSupabaseAdmin()) {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("orders")
        .update({
          status,
          completed_at: completedAt,
        })
        .eq("id", orderId);

      if (!error) {
        return { ok: true, message: status === "completed" ? "已标记为已完成" : "已恢复为待处理" };
      }

      console.warn("Failed to update order in Supabase:", error.message);
    } catch (err) {
      console.warn("Failed to update order in Supabase:", err);
    }
  }

  const updated = await updateLocalOrderStatus(orderId, status);
  if (!updated) {
    return { ok: false, message: "未找到该订单" };
  }

  return { ok: true, message: status === "completed" ? "已标记为已完成" : "已恢复为待处理" };
}
