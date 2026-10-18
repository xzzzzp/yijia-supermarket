import { requireAdmin } from "@/lib/admin-auth";
import { fetchOrderRecords } from "@/lib/orders.server";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrderTable } from "@/components/admin/OrderTable";

export default async function AdminOrdersPage() {
  const user = await requireAdmin();

  if (!canViewOrders(user)) {
    return (
      <AccessDenied message="没有订单相关权限。需要配货、查看收益/统计或接单通知之一。请联系店主开通。" />
    );
  }

  const orders = await fetchOrderRecords();
  const showStats = hasCapability(user, "viewStats");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
        <p className="mt-1 text-sm text-slate-600">
          {ORDER_STATUSES.map((status) => ORDER_STATUS_LABELS[status]).join(" → ")}
          。只有「{ORDER_STATUS_LABELS.completed}」会写入回款时间，并计入营收和热销。当面收款仍在线下完成。只能前进或退回相邻一步，且需要配货权限。
        </p>
      </div>
      <OrderTable
        orders={orders}
        canFulfill={hasCapability(user, "fulfillment")}
        showStats={showStats}
        notificationsEnabled={hasCapability(user, "orderNotifications")}
      />
    </>
  );
}
