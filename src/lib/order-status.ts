import type { OrderStatus } from "@/types/order";

/**
 * 履约只保留四态，且只能在相邻状态之间前进或退回一步：
 * pending → confirmed ↔ delivering ↔ completed。
 * pending 没有上一态。completed 只能退回 delivering。
 */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "delivering",
  "completed",
] as const;

/** 已下线。历史行迁移为 delivering，不能再作为目标状态。 */
export const RETIRED_AWAITING_REMITTANCE_STATUS = "awaiting_remittance";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  delivering: "配送中",
  completed: "已完成",
};

export const ORDER_STATUS_HINTS: Record<OrderStatus, string> = {
  pending: "新订单，等待商家确认",
  confirmed: "商家已确认，等待配送员出门",
  delivering: "已出门配送，含送达和当面收款；货款尚未交回店铺",
  completed: "配送员已回店并交回货款，计入成交",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** 读到已下线的 awaiting_remittance 时并入 delivering，避免被当成已完成。 */
export function coerceOrderStatus(value: unknown): OrderStatus {
  if (value === RETIRED_AWAITING_REMITTANCE_STATUS) return "delivering";
  if (isOrderStatus(value)) return value;
  return "pending";
}

export function emptyStatusCounts(): Record<OrderStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    delivering: 0,
    completed: 0,
  };
}

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUSES.indexOf(status);
  if (index < 0 || index >= ORDER_STATUSES.length - 1) return null;
  return ORDER_STATUSES[index + 1];
}

export function previousOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUSES.indexOf(status);
  if (index <= 0) return null;
  return ORDER_STATUSES[index - 1];
}

export function isAdjacentOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return nextOrderStatus(from) === to || previousOrderStatus(from) === to;
}
