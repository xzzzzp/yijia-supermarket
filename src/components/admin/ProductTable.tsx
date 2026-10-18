"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CategoryInfo, Product } from "@/types/product";
import { formatPrice } from "@/lib/products";
import { ProductImage } from "@/components/ProductImage";
import { deleteProduct } from "@/app/admin/actions";

interface ProductTableProps {
  products: Product[];
  categories: CategoryInfo[];
}

export function ProductTable({ products, categories }: ProductTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.nameRu, p.nameUz, p.sourceKey, p.category]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, category, keyword]);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`确定删除「${name}」吗？`)) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.ok) {
        alert(result.message);
      } else {
        router.refresh();
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-[160px] flex-1">
          <label htmlFor="admin-category" className="block text-xs font-medium text-slate-500">
            分类筛选
          </label>
          <select
            id="admin-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500"
          >
            <option value="">全部分类（{products.length}）</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.nameZh} ({categoryCounts[cat.slug] ?? 0})
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-[2]">
          <label htmlFor="admin-keyword" className="block text-xs font-medium text-slate-500">
            搜索
          </label>
          <input
            id="admin-keyword"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="名称 / source_key"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
        </div>
        {(category || keyword) && (
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setKeyword("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            清除筛选
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500">
        显示 {filtered.length} / {products.length} 个商品
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">图片</th>
                <th className="px-4 py-3 font-semibold">名称</th>
                <th className="px-4 py-3 font-semibold">分类</th>
                <th className="px-4 py-3 font-semibold">价格</th>
                <th className="px-4 py-3 font-semibold">库存</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const catInfo = categories.find((cat) => cat.slug === p.category);
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-50">
                        <ProductImage
                          image={p.image}
                          alt={p.name}
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.nameRu}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{catInfo?.nameZh ?? p.category}</p>
                      <p className="text-xs text-slate-400">{p.category}</p>
                    </td>
                    <td className="px-4 py-3">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">{p.inStock ? "有货" : "缺货"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            p.isPublished
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.isPublished ? "已上架" : "未上架"}
                        </span>
                        {p.isNew && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                            新品
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          编辑
                        </Link>
                        <button
                          type="button"
                          disabled={pending && deletingId === p.id}
                          onClick={() => handleDelete(p.id, p.name)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="py-12 text-center text-slate-500">
            {products.length ? "没有符合筛选条件的商品" : "暂无商品，点击「新增商品」添加"}
          </p>
        )}
      </div>
    </div>
  );
}
