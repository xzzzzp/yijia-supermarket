import Link from "next/link";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import type { AdminSession } from "@/types/staff";

export function AdminNav({ user }: { user: AdminSession }) {
  const links = [
    { href: "/admin", label: "商品列表", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/orders", label: "订单管理", visible: canViewOrders(user) },
    { href: "/admin/settings", label: "店铺设置", visible: user.isOwner },
    { href: "/admin/products/new", label: "新增商品", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/import", label: "批量导入图片", visible: hasCapability(user, "manageProducts") },
    { href: "/admin/staff", label: "店员权限", visible: user.isOwner },
  ].filter((link) => link.visible);

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
      <form action="/admin/logout" method="POST" className="ml-auto">
        <button
          type="submit"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          退出登录
        </button>
      </form>
    </nav>
  );
}
