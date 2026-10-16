import type { OrderStatus } from "@/types/order";

/** 履约顺序与产品文档 §5 建议方向一致。 */
export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "delivering",
  "awaiting_remittance",
  "completed",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待电话确认",
  confirmed: "已确认待配送",
  delivering: "配送中",
  awaiting_remittance: "已收款待回款",
  completed: "已完成",
};

export const ORDER_STATUS_HINTS: Record<OrderStatus, string> = {
  pending: "新订单，等待商家电话确认",
  confirmed: "已电话确认，等待安排配送",
  delivering: "配送员已出门配送",
  awaiting_remittance: "已当面线下收款，货款尚未交回店铺",
  completed: "配送员已回店回款，计入成交",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function emptyStatusCounts(): Record<OrderStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    delivering: 0,
    awaiting_remittance: 0,
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
