import type { OrderStatus } from "@/types/order";

export type OrderListFilter = "all" | OrderStatus;

/** 订单列表筛选用到的字段。状态文案由调用方传入，与订单管理页搜索框一致。 */
export interface OrderListQuery {
  id: string;
  status: OrderStatus;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
  orderText?: string;
  channel?: string;
}

export interface OrderFocusResolution {
  found: boolean;
  statusFilter: OrderListFilter;
  keyword: string;
}

export function readFocusOrderId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function adminOrderFocusPath(orderId: string): string {
  return `/admin/orders?${new URLSearchParams({ focus: orderId }).toString()}`;
}

export function orderMatchesListQuery(order: OrderListQuery, keyword: string, statusLabel: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    order.customerName,
    order.customerPhone,
    order.customerAddress,
    order.note,
    order.orderText,
    order.channel,
    order.id,
    statusLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function orderVisibleInList(
  order: OrderListQuery,
  statusFilter: OrderListFilter,
  keyword: string,
  statusLabel: string,
): boolean {
  if (statusFilter !== "all" && order.status !== statusFilter) return false;
  return orderMatchesListQuery(order, keyword, statusLabel);
}

/**
 * 通知点进订单管理时，若当前筛选把目标订单藏起来，回到「全部」并清空搜索。
 * 订单不存在时保持筛选不变，由页面给出找不到的提示。
 */
export function resolveOrderFocus(
  orders: OrderListQuery[],
  focusOrderId: string,
  statusFilter: OrderListFilter,
  keyword: string,
  statusLabel: (status: OrderStatus) => string,
): OrderFocusResolution {
  const order = orders.find((item) => item.id === focusOrderId);
  if (!order) return { found: false, statusFilter, keyword };
  if (!orderVisibleInList(order, statusFilter, keyword, statusLabel(order.status))) {
    return { found: true, statusFilter: "all", keyword: "" };
  }
  return { found: true, statusFilter, keyword };
}
