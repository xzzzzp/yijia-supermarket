import { notFound } from "next/navigation";
import { fetchProductById } from "@/lib/products.server";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">编辑商品</h1>
      <p className="mb-6 text-sm text-slate-500">{product.name}</p>
      {saved === "1" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          商品创建成功
        </p>
      )}
      <ProductForm mode="edit" product={product} />
    </>
  );
}
