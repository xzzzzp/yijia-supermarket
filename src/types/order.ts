export type OrderChannel = "wechat" | "telegram";
export type OrderStatus = "pending" | "completed";

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
  pendingCount: number;
  totalRevenue: number;
  soldProducts: SoldProductStat[];
}
