"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { CategoryInfo, Product } from "@/types/product";
import { formatPrice } from "@/lib/products";
import { recommendSortError } from "@/types/admin";
import { ProductImage } from "@/components/ProductImage";
import { deleteProduct, updateProductRecommendation } from "@/app/admin/actions";

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
  const [recommendOnly, setRecommendOnly] = useState(false);

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
      if (recommendOnly && !p.isNew) return false;
      if (category && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.nameRu, p.nameUz, p.sourceKey, p.category]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, category, keyword, recommendOnly]);

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
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <div className="w-full md:min-w-[160px] md:w-auto md:flex-1">
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
        <div className="w-full md:min-w-[200px] md:w-auto md:flex-[2]">
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
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700 md:min-h-0 md:gap-2 md:pb-2">
          <input
            type="checkbox"
            checked={recommendOnly}
            onChange={(e) => setRecommendOnly(e.target.checked)}
            className="size-5 rounded border-slate-300 text-red-600 md:size-4"
          />
          仅看新品推荐
        </label>
        {(category || keyword || recommendOnly) && (
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setKeyword("");
              setRecommendOnly(false);
            }}
            className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 md:min-h-0 md:w-auto"
          >
            清除筛选
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500">
        显示 {filtered.length} / {products.length} 个商品
      </p>

      <div className="space-y-3 md:hidden">
        {filtered.map((p) => {
          const catInfo = categories.find((cat) => cat.slug === p.category);
          return (
            <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  <ProductImage image={p.image} alt={p.name} className="object-contain p-1" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-6 font-semibold break-words text-slate-900">{p.name}</p>
                  {p.nameRu ? <p className="mt-1 text-sm leading-5 break-words text-slate-500">{p.nameRu}</p> : null}
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">分类</dt>
                  <dd className="min-w-0 text-right break-words text-slate-900">{catInfo?.nameZh ?? p.category}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">价格</dt>
                  <dd className="font-semibold whitespace-nowrap text-red-600">{formatPrice(p.price)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">库存</dt>
                  <dd className={p.inStock ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
                    {p.inStock ? "有货" : "缺货"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">状态</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        p.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.isPublished ? "已上架" : "未上架"}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <RecommendationEditor
                  key={`${p.id}:${p.isNew}:${p.recommendSort}:card`}
                  product={p}
                  variant="card"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  编辑
                </Link>
                <button
                  type="button"
                  disabled={pending && deletingId === p.id}
                  onClick={() => handleDelete(p.id, p.name)}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <p className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm md:hidden">
          {products.length ? "没有符合筛选条件的商品" : "暂无商品，点击「新增商品」添加"}
        </p>
      )}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">图片</th>
                <th className="px-4 py-3 font-semibold">名称</th>
                <th className="px-4 py-3 font-semibold">分类</th>
                <th className="px-4 py-3 font-semibold">价格</th>
                <th className="px-4 py-3 font-semibold">库存</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">是否新品推荐</th>
                <th className="px-4 py-3 font-semibold">推荐排序</th>
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
                      </div>
                    </td>
                    <RecommendationEditor key={`${p.id}:${p.isNew}:${p.recommendSort}`} product={p} />
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

function RecommendationEditor({
  product,
  variant = "table",
}: {
  product: Product;
  variant?: "table" | "card";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isNew, setIsNew] = useState(product.isNew);
  const [sort, setSort] = useState(String(product.recommendSort));
  const [error, setError] = useState("");

  const persist = (nextIsNew: boolean, recommendSort: number) => {
    if (nextIsNew === product.isNew && recommendSort === product.recommendSort) return;
    setError("");
    startTransition(async () => {
      const result = await updateProductRecommendation(product.id, nextIsNew, recommendSort);
      if (!result.ok) {
        setError(result.message);
        setIsNew(product.isNew);
        setSort(String(product.recommendSort));
        return;
      }
      router.refresh();
    });
  };

  const readSort = (raw: string) => {
    if (raw.trim() === "") return { ok: false as const, message: "请填写推荐排序" };
    const value = Number(raw.trim());
    const message = recommendSortError(value);
    if (message) return { ok: false as const, message };
    return { ok: true as const, value };
  };

  const toggle = (
    <label
      className={
        variant === "card"
          ? "flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700"
          : "inline-flex items-center gap-2 text-xs font-medium text-slate-700"
      }
    >
      <input
        type="checkbox"
        checked={isNew}
        disabled={pending}
        aria-label={`是否新品推荐：${product.name}`}
        onChange={(event) => {
          const parsed = readSort(sort);
          if (!parsed.ok) {
            setError(parsed.message);
            return;
          }
          setIsNew(event.target.checked);
          persist(event.target.checked, parsed.value);
        }}
        className={`rounded border-slate-300 text-red-600 disabled:opacity-50 ${
          variant === "card" ? "size-5" : "h-4 w-4"
        }`}
      />
      {isNew ? (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">新品推荐</span>
      ) : (
        <span className="text-slate-400">未推荐</span>
      )}
    </label>
  );

  const sortField = (
    <div className={variant === "card" ? "block" : undefined}>
      {variant === "card" ? <p className="text-xs font-medium text-slate-500">推荐排序</p> : null}
      <input
        type="number"
        inputMode="numeric"
        aria-label={`推荐排序：${product.name}`}
        value={sort}
        disabled={pending}
        onChange={(event) => setSort(event.target.value)}
        onBlur={() => {
          const parsed = readSort(sort);
          if (!parsed.ok) {
            setError(parsed.message);
            return;
          }
          persist(isNew, parsed.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={
          variant === "card"
            ? "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 disabled:opacity-50"
            : "w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-red-500 disabled:opacity-50"
        }
      />
      {error && <p className="mt-1 max-w-full text-xs break-words text-red-600 md:max-w-56">{error}</p>}
    </div>
  );

  if (variant === "card") {
    return (
      <div className="space-y-3 rounded-xl bg-slate-50 p-3">
        {toggle}
        {sortField}
      </div>
    );
  }

  return (
    <>
      <td className="px-4 py-3">{toggle}</td>
      <td className="px-4 py-3">{sortField}</td>
    </>
  );
}
