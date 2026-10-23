import { computeOrderStats } from "@/lib/order-stats";
import { formatPrice } from "@/lib/products";
import type { OrderRecord } from "@/types/order";

export function OrderStats({ orders }: { orders: OrderRecord[] }) {
  const stats = computeOrderStats(orders);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">已完成订单</p>
          <p className="mt-2 text-3xl font-bold break-words text-slate-900">{stats.completedCount}</p>
          <p className="mt-1 text-xs text-slate-500">回店回款后才计入。配送中不计入。</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-700">已完成收入</p>
          <p className="mt-2 text-3xl font-bold break-words text-emerald-800">{formatPrice(stats.totalRevenue)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">热销（已完成订单）</h2>
        {stats.soldProducts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">暂无已完成订单的销售数据。</p>
        ) : (
          <>
          <div className="mt-4 space-y-3 md:hidden">
            {stats.soldProducts.map((item) => (
              <article key={`${item.productId}-${item.name}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm leading-6 font-semibold break-words text-slate-900">{item.name}</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">规格</dt>
                    <dd className="min-w-0 text-right break-words text-slate-700">{item.spec || "—"}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">销量</dt>
                    <dd className="font-semibold text-slate-900">{item.quantity}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">销售额</dt>
                    <dd className="font-bold whitespace-nowrap text-red-600">{formatPrice(item.revenue)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">商品</th>
                  <th className="px-3 py-2 font-semibold">规格</th>
                  <th className="px-3 py-2 font-semibold">销量</th>
                  <th className="px-3 py-2 font-semibold">销售额</th>
                </tr>
              </thead>
              <tbody>
                {stats.soldProducts.map((item) => (
                  <tr key={`${item.productId}-${item.name}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-2 text-slate-900">{item.name}</td>
                    <td className="px-3 py-2 text-slate-600">{item.spec || "—"}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{item.quantity}</td>
                    <td className="px-3 py-2 font-bold text-red-600">{formatPrice(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
