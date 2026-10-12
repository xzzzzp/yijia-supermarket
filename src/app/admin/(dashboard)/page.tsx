import Link from "next/link";
import { getAdminAuthMode } from "@/lib/admin-auth";
import { fetchAllProducts } from "@/lib/products.server";
import { ProductTable } from "@/components/admin/ProductTable";

export default async function AdminPage() {
  const products = await fetchAllProducts();
  const authMode = getAdminAuthMode();

  return (
    <>
      {authMode === "dev" && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          本地开发模式：当前显示示例商品。配置 Supabase 后可持久化增删改数据。
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">商品管理</h1>
          <p className="mt-1 text-sm text-slate-600">共 {products.length} 个商品</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          + 新增商品
        </Link>
      </div>
      <ProductTable products={products} />
    </>
  );
}
