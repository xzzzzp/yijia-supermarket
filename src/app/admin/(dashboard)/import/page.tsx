import { requireAdmin } from "@/lib/admin-auth";
import { listCategories } from "@/lib/categories.server";
import { hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ExcelImportPanel } from "@/components/admin/ExcelImportPanel";
import { ImageBatchImport } from "@/components/admin/ImageBatchImport";

export default async function ImportPage() {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return <AccessDenied message="没有商品上架权限，不能导入商品或图片。" />;
  }

  const directory = await listCategories();

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">商品导入</h1>
      <p className="mb-6 text-sm text-slate-600">
        Excel 按名称和规格新建或更新。图片文件名等于名称加规格时设为主图。原来按 source_key 补图的工具仍留在下面。
      </p>
      <div className="mb-8">
        <ExcelImportPanel />
      </div>
      <ImageBatchImport categories={directory.categories} />
    </>
  );
}
