import { fetchOrderRecords } from "@/lib/orders.server";
import { OrderTable } from "@/components/admin/OrderTable";

export default async function AdminOrdersPage() {
  const orders = await fetchOrderRecords();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
        <p className="mt-1 text-sm text-slate-600">
          管理订单状态，并统计已完成订单的收入与销量
        </p>
      </div>
      <OrderTable orders={orders} />
    </>
  );
}
