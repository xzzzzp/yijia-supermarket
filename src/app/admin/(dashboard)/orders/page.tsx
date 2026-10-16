import { requireAdmin } from "@/lib/admin-auth";
import { fetchOrderRecords } from "@/lib/orders.server";
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
          待电话确认 → 已确认待配送 → 配送中 → 已收款待回款 → 已完成。已完成表示配送员已回店回款，只有这一状态计入营收和热销。当面收款仍在线下完成。
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
