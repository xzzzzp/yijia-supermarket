import { requireAdmin } from "@/lib/admin-auth";
import { hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ImageBatchImport } from "@/components/admin/ImageBatchImport";

export default async function ImportPage() {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return <AccessDenied message="没有商品上架权限，不能使用批量导入图片。" />;
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">批量导入图片</h1>
      <p className="mb-6 text-sm text-slate-600">可选辅助：给已有商品补图，不替代人工新增商品。</p>
      <ImageBatchImport />
    </>
  );
}
