"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/admin/notification-actions";
import type { OrderNotificationView } from "@/types/notification";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-Hans-CN", {
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

export function NotificationList({ notifications }: { notifications: OrderNotificationView[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const unread = notifications.filter((item) => !item.readAt).length;

  const run = (id: string | null, action: () => Promise<{ ok: boolean; message: string }>) => {
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) alert(result.message);
      else router.refresh();
      setPendingId(null);
    });
  };

  if (!notifications.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
        暂无接单通知。新订单会通知店主，以及打开了接单通知的店员。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">未读 {unread} 条。这里只显示站内通知。</p>
        {unread > 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("all", () => markAllNotificationsReadAction())}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isPending && pendingId === "all" ? "处理中…" : "全部标为已读"}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">时间</th>
                <th className="px-4 py-3 font-semibold">订单</th>
                <th className="px-4 py-3 font-semibold">客户</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((item) => {
                const unreadRow = !item.readAt;
                const rowPending = isPending && pendingId === item.notificationId;
                return (
                  <tr
                    key={item.notificationId}
                    className={`border-b border-slate-100 last:border-b-0 ${unreadRow ? "bg-red-50/60" : ""}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">{item.orderId}</td>
                    <td className="px-4 py-3 text-slate-900">{item.customerName || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          unreadRow ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {unreadRow ? "未读" : "已读"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {unreadRow ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => run(item.notificationId, () => markNotificationReadAction(item.notificationId))}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {rowPending ? "处理中…" : "标为已读"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {item.readAt ? formatDate(item.readAt) : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
