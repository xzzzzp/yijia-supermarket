import Link from "next/link";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import type { AdminSession } from "@/types/staff";

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

export function AdminNav({ user, unreadCount }: { user: AdminSession; unreadCount: number }) {
  const links = [
    { href: "/admin", label: "商品列表", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/categories", label: "热门分类", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/orders", label: "订单管理", visible: canViewOrders(user) },
    { href: "/admin/settings", label: "店铺设置", visible: user.isOwner },
    { href: "/admin/products/new", label: "新增商品", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/import", label: "批量导入图片", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/staff", label: "店员权限", visible: user.isOwner },
    { href: "/admin/audit-logs", label: "操作日志", visible: user.isOwner },
  ].filter((link) => link.visible);

  const showBell = hasCapability(user, "orderNotifications");
  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          {link.label}
        </Link>
      ))}
      <div className="ml-auto flex items-center gap-2">
        {showBell && (
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
        )}
        <form action="/admin/logout" method="POST">
          <button
            type="submit"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            退出登录
          </button>
        </form>
      </div>
    </nav>
  );
}
