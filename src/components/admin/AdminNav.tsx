import Link from "next/link";
import { OrderNotificationBell } from "@/components/admin/OrderNotificationBell";
import { getBasePath } from "@/lib/paths";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import type { AdminSession } from "@/types/staff";

export function AdminNav({
  user,
  unreadCount,
  newestNotificationId,
}: {
  user: AdminSession;
  unreadCount: number;
  newestNotificationId: string | null;
}) {
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
          <OrderNotificationBell
            initialUnreadCount={unreadCount}
            initialNewestNotificationId={newestNotificationId}
          />
        )}
        <form action={logoutAction} method="POST">
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
