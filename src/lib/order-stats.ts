import { emptyStatusCounts, isOrderStatus } from "@/lib/order-status";
import type { OrderRecord, OrderStatsSummary, SoldProductStat } from "@/types/order";

export function normalizeOrderRecord(order: Partial<OrderRecord> & Pick<OrderRecord, "id" | "channel" | "items" | "total" | "orderText" | "createdAt">): OrderRecord {
  const status = isOrderStatus(order.status) ? order.status : "pending";

  return {
    id: order.id,
    channel: order.channel,
    status,
    items: order.items,
    total: order.total,
    customerName: order.customerName ?? null,
    customerPhone: order.customerPhone ?? null,
    customerAddress: order.customerAddress ?? null,
    note: order.note ?? null,
    orderText: order.orderText,
    requestToken: order.requestToken ?? null,
    createdAt: order.createdAt,
    completedAt: status === "completed" ? (order.completedAt ?? null) : null,
  };
}

export function computeOrderStats(orders: OrderRecord[]): OrderStatsSummary {
  const statusCounts = emptyStatusCounts();
  const productMap = new Map<string, SoldProductStat>();
  let totalRevenue = 0;

  for (const order of orders) {
    statusCounts[order.status] += 1;
    if (order.status !== "completed") continue;

    totalRevenue += order.total;

    for (const item of order.items) {
      const key = item.productId || `${item.name}::${item.spec}`;
      const revenue = item.price * item.quantity;
      const existing = productMap.get(key);

      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += revenue;
      } else {
        productMap.set(key, {
          productId: item.productId,
          name: item.name,
          spec: item.spec,
          quantity: item.quantity,
          revenue,
        });
      }
    }
  }

  return {
    completedCount: statusCounts.completed,
    pendingCount: statusCounts.pending,
    statusCounts,
    totalRevenue,
    soldProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
  };
}
