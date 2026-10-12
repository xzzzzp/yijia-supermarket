import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">新增商品</h1>
      <ProductForm mode="create" />
    </>
  );
}
