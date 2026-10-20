export type OrderChannel = "wechat" | "telegram";

/**
 * 履约状态（四态，仅相邻 ±1）：
 * pending 待确认 → confirmed 已确认 → delivering 配送中 → completed 已完成。
 * delivering 含出门、送达和当面收款。completed 仍是配送员回店并交回货款。
 * 已下线的 awaiting_remittance 读入时并入 delivering，不计入营收。
 */
export type OrderStatus = "pending" | "confirmed" | "delivering" | "completed";

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  spec: string;
  price: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CartItem[];
  channel: OrderChannel;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  requestToken: string;
}

export interface CreateOrderResponse {
  ok: boolean;
  message?: string;
  orderId?: string;
  redirectUrl?: string;
  orderText?: string;
}

export interface OrderRecord {
  id: string;
  channel: OrderChannel;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
  orderText: string;
  createdAt: string;
  completedAt?: string | null;
  /** 下单幂等键。重复提交同一 token 必须回到这笔订单。 */
  requestToken?: string | null;
}

export interface SoldProductStat {
  productId: string;
  name: string;
  spec: string;
  quantity: number;
  revenue: number;
}

export interface OrderStatsSummary {
  completedCount: number;
  /** 仅 `pending`（待确认），不含配送中等中间态。 */
  pendingCount: number;
  statusCounts: Record<OrderStatus, number>;
  totalRevenue: number;
  soldProducts: SoldProductStat[];
}
