"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderCompleted, markOrderPending } from "@/app/admin/actions";
import { computeOrderStats } from "@/lib/order-stats";
import { formatPrice } from "@/lib/products";
import type { OrderRecord } from "@/types/order";

interface OrderTableProps {
  orders: OrderRecord[];
}

type StatusFilter = "all" | "pending" | "completed";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function channelLabel(channel: OrderRecord["channel"]): string {
  return channel === "wechat" ? "微信" : "Telegram";
}

function statusLabel(status: OrderRecord["status"]): string {
  return status === "completed" ? "已完成" : "待处理";
}

export function OrderTable({ orders }: OrderTableProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter === "pending" && order.status !== "pending") return false;
      if (statusFilter === "completed" && order.status !== "completed") return false;

      if (!q) return true;

      const haystack = [
        order.customerName,
        order.customerPhone,
        order.customerAddress,
        order.note,
        order.orderText,
        order.channel,
        order.id,
        statusLabel(order.status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, keyword, statusFilter]);

  const handleMarkCompleted = (orderId: string) => {
    setPendingId(orderId);
    startTransition(async () => {
      const result = await markOrderCompleted(orderId);
      if (!result.ok) {
        alert(result.message);
      } else {
        router.refresh();
      }
      setPendingId(null);
    });
  };

  const handleMarkPending = (orderId: string) => {
    setPendingId(orderId);
    startTransition(async () => {
      const result = await markOrderPending(orderId);
      if (!result.ok) {
        alert(result.message);
      } else {
        router.refresh();
      }
      setPendingId(null);
    });
  };

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: orders.length },
    { key: "pending", label: "待处理", count: stats.pendingCount },
    { key: "completed", label: "已完成", count: stats.completedCount },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">已完成订单</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.completedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-700">已完成收入</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">待处理订单</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{stats.pendingCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">销售统计（已完成订单）</h2>
        {stats.soldProducts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">暂无已完成订单的销售数据。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
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
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              statusFilter === tab.key
                ? "bg-red-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索姓名、电话、地址、备注…"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
        />
      </div>

      {!orders.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
          暂无订单。客户提交订单后会显示在这里。
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">时间</th>
                  <th className="px-4 py-3 font-semibold">客户</th>
                  <th className="px-4 py-3 font-semibold">电话</th>
                  <th className="px-4 py-3 font-semibold">渠道</th>
                  <th className="px-4 py-3 font-semibold">状态</th>
                  <th className="px-4 py-3 font-semibold">金额</th>
                  <th className="px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const expanded = expandedId === order.id;
                  const rowPending = isPending && pendingId === order.id;

                  return (
                    <tr key={order.id} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{order.customerName || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {order.customerPhone || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.channel === "wechat"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {channelLabel(order.channel)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {order.status !== "completed" ? (
                            <button
                              type="button"
                              disabled={rowPending}
                              onClick={() => handleMarkCompleted(order.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {rowPending ? "处理中…" : "标记已完成"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={rowPending}
                              onClick={() => handleMarkPending(order.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {rowPending ? "处理中…" : "恢复待处理"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : order.id)}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            {expanded ? "收起" : "详情"}
                          </button>
                        </div>
                        {expanded && (
                          <div className="mt-3 max-w-md space-y-3 text-slate-700">
                            {order.completedAt && (
                              <p>
                                <span className="font-semibold text-slate-900">完成时间：</span>
                                {formatDate(order.completedAt)}
                              </p>
                            )}
                            {order.customerAddress && (
                              <p>
                                <span className="font-semibold text-slate-900">地址：</span>
                                {order.customerAddress}
                              </p>
                            )}
                            {order.note && (
                              <p>
                                <span className="font-semibold text-slate-900">备注：</span>
                                {order.note}
                              </p>
                            )}
                            <div>
                              <p className="mb-1 font-semibold text-slate-900">商品明细</p>
                              <ul className="space-y-1 text-xs">
                                {order.items.map((item, idx) => (
                                  <li key={`${order.id}-${idx}`}>
                                    {item.name} ({item.spec}) × {item.quantity} —{" "}
                                    {formatPrice(item.price * item.quantity)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="mb-1 font-semibold text-slate-900">订单文本</p>
                              <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap">
                                {order.orderText}
                              </pre>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {orders.length > 0 && filtered.length === 0 && (
        <p className="text-center text-sm text-slate-500">没有匹配的订单</p>
      )}
    </div>
  );
}
