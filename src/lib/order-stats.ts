import type { OrderRecord, OrderStatsSummary, SoldProductStat } from "@/types/order";

export function normalizeOrderRecord(order: Partial<OrderRecord> & Pick<OrderRecord, "id" | "channel" | "items" | "total" | "orderText" | "createdAt">): OrderRecord {
  return {
    id: order.id,
    channel: order.channel,
    status: order.status === "completed" ? "completed" : "pending",
    items: order.items,
    total: order.total,
    customerName: order.customerName ?? null,
    customerPhone: order.customerPhone ?? null,
    customerAddress: order.customerAddress ?? null,
    note: order.note ?? null,
    orderText: order.orderText,
    createdAt: order.createdAt,
    completedAt: order.completedAt ?? null,
  };
}

export function computeOrderStats(orders: OrderRecord[]): OrderStatsSummary {
  const completed = orders.filter((order) => order.status === "completed");
  const pending = orders.filter((order) => order.status !== "completed");
  const productMap = new Map<string, SoldProductStat>();

  let totalRevenue = 0;

  for (const order of completed) {
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
    completedCount: completed.length,
    pendingCount: pending.length,
    totalRevenue,
    soldProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
  };
}
