"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrderNotificationBell } from "@/components/admin/OrderNotificationBell";
import { getBasePath } from "@/lib/paths";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import type { AdminSession } from "@/types/staff";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function isCurrentPath(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(`${href}/`);
}

export function AdminNav({
  user,
  unreadCount,
  newestNotificationId,
}: {
  user: AdminSession;
  unreadCount: number;
  newestNotificationId: string | null;
}) {
  const pathname = usePathname() || "";
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const path = normalizePath(pathname);
  const open = menuPath !== null && menuPath === path;

  const links = [
    { href: "/admin", label: "商品列表", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/categories", label: "热门分类", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/orders", label: "订单管理", visible: canViewOrders(user) },
    { href: "/admin/stats", label: "数据统计", visible: hasCapability(user, "viewStats") },
    { href: "/admin/settings", label: "店铺设置", visible: user.isOwner },
    { href: "/admin/products/new", label: "新增商品", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/import", label: "批量导入图片", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/staff", label: "店员权限", visible: user.isOwner },
    { href: "/admin/audit-logs", label: "操作日志", visible: user.isOwner },
  ].filter((link) => link.visible);

  const showBell = hasCapability(user, "orderNotifications");
  // 原生 form action 不会像 next/link 那样自动加 basePath。写死 /admin/logout 会打到子路径外面，
  // Cookie Path=/yijia 带不上，生产 nginx 也不把这个路径转给本应用。
  const basePath = getBasePath();
  const logoutAction = basePath ? `${basePath}/admin/logout/` : "/admin/logout";

  const closeMenu = () => setMenuPath(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const bottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      document.documentElement.style.setProperty("--admin-nav-bottom", `${bottom}px`);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPath(null);
    };
    const media = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (media.matches) setMenuPath(null);
    };
    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onWide);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onWide);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <nav
        ref={navRef}
        aria-label="后台导航"
        className="sticky top-0 z-40 -mx-5 mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-100 px-5 py-3 md:static md:z-auto md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:pb-4"
      >
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
          aria-expanded={open}
          aria-controls="admin-menu-drawer"
          aria-label="打开菜单"
          onClick={() => setMenuPath(open ? null : path)}
        >
          <MenuIcon />
        </button>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="max-md:hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            {link.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {showBell && (
            <OrderNotificationBell
              initialUnreadCount={unreadCount}
              initialNewestNotificationId={newestNotificationId}
            />
          )}
          <form action={logoutAction} method="POST" className="max-md:hidden">
            <button
              type="submit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              退出登录
            </button>
          </form>
        </div>
      </nav>
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-30 md:hidden" style={{ top: "var(--admin-nav-bottom, 0px)" }}>
          <button
            type="button"
            aria-label="关闭菜单"
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeMenu}
          />
          <div
            ref={dialogRef}
            id="admin-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="后台菜单"
            tabIndex={-1}
            className="animate-admin-drawer motion-reduce:animate-none absolute inset-y-0 left-0 flex w-[min(20rem,calc(100%-3.5rem))] flex-col bg-white shadow-xl outline-none"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">后台菜单</p>
              <button
                type="button"
                aria-label="关闭菜单"
                onClick={closeMenu}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
              >
                <CloseIcon />
                关闭
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
              {links.map((link) => {
                const current = isCurrentPath(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    onClick={closeMenu}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      current
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <form action={logoutAction} method="POST" className="shrink-0 border-t border-slate-200 p-3">
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
