export type OrderChannel = "wechat" | "telegram";

/**
 * 履约状态：
 * pending 待电话确认 → confirmed 已确认待配送 → delivering 配送中
 * → awaiting_remittance 已收款待回款 → completed 已回店回款。
 * 旧数据只有 pending | completed，含义保持不变。
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "delivering"
  | "awaiting_remittance"
  | "completed";

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
  /** 仅 `pending`（待电话确认），不含配送中等中间态。 */
  pendingCount: number;
  statusCounts: Record<OrderStatus, number>;
  totalRevenue: number;
  soldProducts: SoldProductStat[];
}
