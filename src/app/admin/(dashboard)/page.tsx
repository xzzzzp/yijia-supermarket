import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, getAdminAuthMode } from "@/lib/admin-auth";
import { listCategories } from "@/lib/categories.server";
import { fetchAllProducts } from "@/lib/products.server";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ProductTable } from "@/components/admin/ProductTable";

export default async function AdminPage() {
  const user = await requireAdmin();

  if (!hasCapability(user, "manageProducts")) {
    const statsOnly =
      hasCapability(user, "viewStats") &&
      !hasCapability(user, "fulfillment") &&
      !hasCapability(user, "orderNotifications");
    if (statsOnly) redirect("/admin/stats");
    if (canViewOrders(user)) redirect("/admin/orders");
    if (user.isOwner) redirect("/admin/staff");
    return (
      <AccessDenied message="当前账号尚未分配权限，请联系店主在「店员权限」中开通。" />
    );
  }

  const [products, directory] = await Promise.all([fetchAllProducts(), listCategories()]);
  const authMode = getAdminAuthMode();

  return (
    <>
      {authMode === "dev" && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          本地开发模式：当前显示示例商品。配置 MYSQL_* 后可持久化增删改商品。
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">商品管理</h1>
          <p className="mt-1 text-sm text-slate-600">
            共 {products.length} 个商品。人工新增和编辑是上架主路径。列表可直接改「是否新品推荐」和「推荐排序」，数字越小越靠前。
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          + 新增商品
        </Link>
      </div>
      <ProductTable products={products} categories={directory.categories} />
    </>
  );
}
