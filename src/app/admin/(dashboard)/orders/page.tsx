import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { readFocusOrderId } from "@/lib/order-focus";
import { fetchOrderRecords } from "@/lib/orders.server";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrderTable } from "@/components/admin/OrderTable";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string | string[] }>;
}) {
  const user = await requireAdmin();

  if (!canViewOrders(user)) {
    return (
      <AccessDenied message="没有订单相关权限。需要配货、查看收益/统计或接单通知之一。请联系店主开通。" />
    );
  }

  const focusOrderId = readFocusOrderId((await searchParams).focus);
  const orders = await fetchOrderRecords();
  const showStatsLink = hasCapability(user, "viewStats");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
        <p className="mt-1 text-sm text-slate-600">
          {ORDER_STATUSES.map((status) => ORDER_STATUS_LABELS[status]).join(" → ")}
          。配送中包含出门、送达和当面收款。只有「{ORDER_STATUS_LABELS.completed}」表示已回店交款。只能在相邻状态之间前进或退回一步，且需要配货权限。
        </p>
        {showStatsLink && (
          <p className="mt-2 text-sm text-slate-600">
            营收和热销在{" "}
            <Link href="/admin/stats" className="font-semibold text-red-700 hover:underline">
              数据统计
            </Link>
            ，只计已完成订单。
          </p>
        )}
      </div>
      <OrderTable
        orders={orders}
        canFulfill={hasCapability(user, "fulfillment")}
        notificationsEnabled={hasCapability(user, "orderNotifications")}
        focusOrderId={focusOrderId}
      />
    </>
  );
}
