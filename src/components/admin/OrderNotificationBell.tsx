"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { pollInAppNotificationHint } from "@/app/admin/notification-actions";
import {
  ADMIN_ORDER_HINT_POLL_MS,
  adminPathNeedsLiveRefresh,
  inAppHintChanged,
  type InAppHintSnapshot,
} from "@/lib/notification-hint";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" />
    </svg>
  );
}

function serverKey(unreadCount: number, newestNotificationId: string | null): string {
  return `${unreadCount}:${newestNotificationId ?? ""}`;
}

export function OrderNotificationBell({
  initialUnreadCount,
  initialNewestNotificationId,
}: {
  initialUnreadCount: number;
  initialNewestNotificationId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const key = serverKey(initialUnreadCount, initialNewestNotificationId);
  const [trackedServerKey, setTrackedServerKey] = useState(key);
  const [override, setOverride] = useState<InAppHintSnapshot | null>(null);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  const serverSnapshotRef = useRef<InAppHintSnapshot>({
    unreadCount: initialUnreadCount,
    newestNotificationId: initialNewestNotificationId,
  });
  const snapshotRef = useRef<InAppHintSnapshot>({
    unreadCount: initialUnreadCount,
    newestNotificationId: initialNewestNotificationId,
  });

  if (trackedServerKey !== key) {
    setTrackedServerKey(key);
    setOverride(null);
  }

  const unreadCount = override?.unreadCount ?? initialUnreadCount;

  useEffect(() => {
    pathnameRef.current = pathname;
    routerRef.current = router;
    serverSnapshotRef.current = {
      unreadCount: initialUnreadCount,
      newestNotificationId: initialNewestNotificationId,
    };
  }, [pathname, router, initialUnreadCount, initialNewestNotificationId]);

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    const tick = async () => {
      if (stopped) return;
      try {
        const hint = await pollInAppNotificationHint();
        if (stopped) return;
        if (!hint.ok) return;
        if (!hint.enabled) {
          stopped = true;
          window.clearInterval(timer);
          return;
        }

        const next: InAppHintSnapshot = {
          unreadCount: hint.unreadCount,
          newestNotificationId: hint.newestNotificationId,
        };
        const changed =
          inAppHintChanged(snapshotRef.current, next) || inAppHintChanged(serverSnapshotRef.current, next);
        snapshotRef.current = next;
        if (!changed) return;
        setOverride(next);
        if (adminPathNeedsLiveRefresh(pathnameRef.current)) {
          startTransition(() => {
            routerRef.current.refresh();
          });
        }
      } catch {
        // 下一轮再试。权限不足或网络抖动都不打断当前页面。
      }
    };

    timer = window.setInterval(() => {
      void tick();
    }, ADMIN_ORDER_HINT_POLL_MS);
    void tick();

    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      href="/admin/notifications"
      aria-label={unreadCount > 0 ? `接单通知，${unreadCount} 条未读` : "接单通知，没有未读"}
      className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] leading-5 font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
