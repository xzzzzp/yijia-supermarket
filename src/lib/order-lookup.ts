import type { OrderRecord, OrderStatus } from "@/types/order";

/** 缺字段、订单不存在、电话不一致都用同一码，避免靠错误差异枚举订单。 */
export type LookupErrorCode = "not_found";

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

const LOOKUP_ATTEMPT_LIMIT = 10;
const LOOKUP_WINDOW_MS = 60_000;

export interface LookupAttemptBucket {
  count: number;
  resetAt: number;
}

/** 限流键：同一 IP + 同一订单号（订单号大小写不敏感）。 */
export function lookupRateKey(ip: string, orderId: string): string {
  const safeIp = ip.trim().slice(0, 64) || "unknown";
  return `${safeIp}|${orderId.trim().toLowerCase()}`;
}

/** 窗口内超过次数返回 true。调用方对拒绝和未命中返回同一失败响应。 */
export function isLookupRateLimited(
  buckets: Map<string, LookupAttemptBucket>,
  key: string,
  now: number,
  limit = LOOKUP_ATTEMPT_LIMIT,
  windowMs = LOOKUP_WINDOW_MS,
): boolean {
  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export function lookupOrders(orders: OrderRecord[], query: OrderLookupQuery): OrderLookupResult {
  const phone = normalizeLookupPhone(query.phone ?? "");
  const orderId = (query.orderId ?? "").trim().toLowerCase();

  if (!phone || !orderId) {
    return { ok: false, code: "not_found" };
  }

  const order = orders.find((item) => item.id.toLowerCase() === orderId);
  if (!order || normalizeLookupPhone(order.customerPhone ?? "") !== phone) {
    return { ok: false, code: "not_found" };
  }

  return { ok: true, orders: [order] };
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
