import { requireAdmin } from "@/lib/admin-auth";
import { fetchOrderRecords } from "@/lib/orders.server";
import { hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrderStats } from "@/components/admin/OrderStats";

export default async function AdminStatsPage() {
  const user = await requireAdmin();

  if (!hasCapability(user, "viewStats")) {
    return <AccessDenied message="没有查看收益/统计权限，不能打开数据统计。请联系店主开通。" />;
  }

  const orders = await fetchOrderRecords();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">数据统计</h1>
        <p className="mt-1 text-sm text-slate-600">
          只统计「已完成」订单。配送中包含出门、送达和当面收款，货款交回店铺之前不计入营收和热销。
        </p>
      </div>
      <OrderStats orders={orders} />
    </>
  );
}
