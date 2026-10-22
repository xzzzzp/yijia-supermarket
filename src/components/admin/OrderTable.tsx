"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transitionOrderStatusAction } from "@/app/admin/actions";
import { copyText } from "@/lib/copy-text";
import { displayOrDash, formatDeliveryBlock } from "@/lib/delivery-block";
import { computeOrderStats } from "@/lib/order-stats";
import {
  nextOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_HINTS,
  ORDER_STATUS_LABELS,
  previousOrderStatus,
} from "@/lib/order-status";
import { formatPrice } from "@/lib/products";
import type { OrderRecord, OrderStatus } from "@/types/order";

interface OrderTableProps {
  orders: OrderRecord[];
  canFulfill: boolean;
  notificationsEnabled: boolean;
}

type StatusFilter = "all" | OrderStatus;

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  delivering: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
};

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

export function OrderTable({ orders, canFulfill, notificationsEnabled }: OrderTableProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;

      const haystack = [
        order.customerName,
        order.customerPhone,
        order.customerAddress,
        order.note,
        order.orderText,
        order.channel,
        order.id,
        ORDER_STATUS_LABELS[order.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, keyword, statusFilter]);

  const handleTransition = (orderId: string, status: OrderStatus) => {
    setPendingId(orderId);
    startTransition(async () => {
      const result = await transitionOrderStatusAction(orderId, status);
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
    ...ORDER_STATUSES.map((status) => ({
      key: status,
      label: ORDER_STATUS_LABELS[status],
      count: stats.statusCounts[status],
    })),
  ];

  return (
    <div className="space-y-4">
      {notificationsEnabled && (
        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          已开启接单通知。新订单会给店主和打开该开关的店员写入站内通知，可在右上角铃铛查看。
        </p>
      )}

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
                  const rowPending = isPending && pendingId === order.id;
                  const deliveryText = formatDeliveryBlock(order);
                  const next = nextOrderStatus(order.status);
                  const previous = previousOrderStatus(order.status);

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
                          title={ORDER_STATUS_HINTS[order.status]}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status]}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {canFulfill && next && (
                            <button
                              type="button"
                              disabled={rowPending}
                              onClick={() => handleTransition(order.id, next)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {rowPending ? "处理中…" : `推进至${ORDER_STATUS_LABELS[next]}`}
                            </button>
                          )}
                          {canFulfill && previous && (
                            <button
                              type="button"
                              disabled={rowPending}
                              onClick={() => handleTransition(order.id, previous)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {rowPending ? "处理中…" : `退回至${ORDER_STATUS_LABELS[previous]}`}
                            </button>
                          )}
                        </div>
                        <div className="mt-3 max-w-xl space-y-3 text-slate-700">
                          <p>
                            <span className="font-semibold text-slate-900">履约：</span>
                            {ORDER_STATUS_HINTS[order.status]}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">回款时间：</span>
                            {order.completedAt ? formatDate(order.completedAt) : "—"}
                          </p>
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <p className="font-semibold text-slate-900">配送信息</p>
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await copyText(deliveryText);
                                  if (ok) {
                                    setCopiedId(order.id);
                                    return;
                                  }
                                  window.prompt("复制失败，请手动复制：", deliveryText);
                                }}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {copiedId === order.id ? "已复制" : "复制配送信息"}
                              </button>
                            </div>
                            <pre className="rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap">{deliveryText}</pre>
                          </div>
                          {order.note ? (
                            <p>
                              <span className="font-semibold text-slate-900">备注：</span>
                              {order.note}
                            </p>
                          ) : null}
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                              <thead className="text-slate-500">
                                <tr>
                                  <th className="py-1 pr-3 font-semibold">名称</th>
                                  <th className="py-1 pr-3 font-semibold">规格</th>
                                  <th className="py-1 pr-3 font-semibold">数量</th>
                                  <th className="py-1 pr-3 font-semibold">单价</th>
                                  <th className="py-1 font-semibold">小计</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr key={`${order.id}-${idx}`} className="border-t border-slate-100">
                                    <td className="py-1.5 pr-3 font-semibold text-slate-900">{item.name}</td>
                                    <td className="py-1.5 pr-3">{displayOrDash(item.spec)}</td>
                                    <td className="py-1.5 pr-3">{item.quantity}</td>
                                    <td className="py-1.5 pr-3">{formatPrice(item.price)}</td>
                                    <td className="py-1.5 font-semibold">{formatPrice(item.price * item.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
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
