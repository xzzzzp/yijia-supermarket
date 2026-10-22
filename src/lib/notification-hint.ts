/** 有接单通知权限的后台轮询间隔。留出刷新余量，使新订单大约在 5 秒内可见。 */
export const ADMIN_ORDER_HINT_POLL_MS = 3000;

export interface InAppHintSnapshot {
  unreadCount: number;
  newestNotificationId: string | null;
}

export type InAppNotificationPollResult =
  | { ok: true; enabled: false }
  | ({ ok: true; enabled: true } & InAppHintSnapshot)
  | { ok: false; message: string };

export function inAppHintChanged(
  previous: InAppHintSnapshot,
  next: InAppHintSnapshot,
): boolean {
  return (
    previous.unreadCount !== next.unreadCount ||
    previous.newestNotificationId !== next.newestNotificationId
  );
}

/** 这些页面在提示变化时刷新服务端数据：订单列表和站内通知历史。 */
export function adminPathNeedsLiveRefresh(pathname: string): boolean {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return path === "/admin/orders" || path === "/admin/notifications";
}
