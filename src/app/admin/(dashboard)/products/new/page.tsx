import { requireAdmin } from "@/lib/admin-auth";
import { listCategories } from "@/lib/categories.server";
import { hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return <AccessDenied message="没有商品上架权限，不能新增商品。" />;
  }

  const directory = await listCategories();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">新增商品</h1>
      <ProductForm mode="create" categories={directory.categories} />
    </>
  );
}
