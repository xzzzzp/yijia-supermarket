import type { OrderRecord, OrderStatus } from "@/types/order";

export type LookupErrorCode = "need_query" | "not_found" | "mismatch";

export interface OrderLookupQuery {
  phone?: string | null;
  orderId?: string | null;
}

export type OrderLookupResult =
  | { ok: true; orders: OrderRecord[] }
  | { ok: false; code: LookupErrorCode };

export interface PublicOrderItem {
  name: string;
  spec: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface PublicOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  completedAt: string | null;
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note: string;
  items: PublicOrderItem[];
}

/** 比较电话时去掉空格、横线和括号，并忽略开头的 +。 */
export function normalizeLookupPhone(value: string): string {
  return value.trim().replace(/[\s\-()]/g, "").replace(/^\+/, "");
}

export function lookupOrders(orders: OrderRecord[], query: OrderLookupQuery): OrderLookupResult {
  const phone = normalizeLookupPhone(query.phone ?? "");
  const orderId = (query.orderId ?? "").trim().toLowerCase();

  if (!phone && !orderId) {
    return { ok: false, code: "need_query" };
  }

  if (orderId) {
    const order = orders.find((item) => item.id.toLowerCase() === orderId);
    if (!order) return { ok: false, code: "not_found" };
    if (phone && normalizeLookupPhone(order.customerPhone ?? "") !== phone) {
      return { ok: false, code: "mismatch" };
    }
    return { ok: true, orders: [order] };
  }

  const matched = orders.filter((item) => normalizeLookupPhone(item.customerPhone ?? "") === phone);
  return { ok: true, orders: matched };
}

export function toPublicOrder(order: OrderRecord): PublicOrder {
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    completedAt: order.completedAt ?? null,
    total: order.total,
    customerName: order.customerName?.trim() ?? "",
    customerPhone: order.customerPhone?.trim() ?? "",
    customerAddress: order.customerAddress?.trim() ?? "",
    note: order.note?.trim() ?? "",
    items: order.items.map((item) => ({
      name: item.name,
      spec: item.spec,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
    })),
  };
}
