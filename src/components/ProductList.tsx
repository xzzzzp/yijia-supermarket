"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { sortProducts, type SortOption } from "@/lib/products";
import { getCategoryName } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";

interface ProductListProps {
  products: Product[];
  categoryInfo?: { nameZh: string; nameRu: string; nameUz: string };
  title?: string;
}

export function ProductList({ products, categoryInfo, title }: ProductListProps) {
  const { locale, t } = useLanguage();
  const [sort, setSort] = useState<SortOption>("default");

  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);

  const heading =
    title ?? (categoryInfo ? getCategoryName(locale, categoryInfo) : t("newProducts"));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-surface-2 pb-4">
        <h1 className="font-display text-2xl font-semibold text-accent">{heading}</h1>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-surface-2 bg-white px-4 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="default">{t("sortDefault")}</option>
          <option value="price-asc">{t("sortPriceAsc")}</option>
          <option value="price-desc">{t("sortPriceDesc")}</option>
          <option value="name">{t("sortName")}</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="py-20 text-center text-muted">{t("noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
