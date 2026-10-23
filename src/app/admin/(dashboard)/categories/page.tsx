import { requireAdmin } from "@/lib/admin-auth";
import { listCategories } from "@/lib/categories.server";
import { hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return <AccessDenied message="没有商品上架权限，不能管理分类。" />;
  }

  const directory = await listCategories();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">热门分类</h1>
        <p className="mt-1 text-sm text-slate-600">维护分类名称、图标、排序、首页显示和启用状态。商品上架权限即可管理。</p>
      </div>
      <CategoryManager categories={directory.categories} source={directory.source} warning={directory.warning} />
    </>
  );
}
