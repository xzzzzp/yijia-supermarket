"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { sortProducts, type ProductSortMode, type SortOption } from "@/lib/products";
import { getCategoryName } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";

interface ProductListProps {
  products: Product[];
  categoryInfo?: { nameZh: string; nameRu: string; nameUz: string };
  title?: string;
  /** recommend：新品推荐页，默认按推荐排序，并分页加载。 */
  sortMode?: ProductSortMode;
  pageSize?: number;
}

export function ProductList({ products, categoryInfo, title, sortMode = "catalog", pageSize }: ProductListProps) {
  const { locale, t } = useLanguage();
  const [sort, setSort] = useState<SortOption>("default");
  const [visibleCount, setVisibleCount] = useState(pageSize ?? products.length);

  const sorted = useMemo(
    () => sortProducts(products, sort, sortMode),
    [products, sort, sortMode],
  );
  const shown = pageSize ? sorted.slice(0, visibleCount) : sorted;

  const heading =
    title ?? (categoryInfo ? getCategoryName(locale, categoryInfo) : t("newProducts"));

  const sortChoices: { value: SortOption; label: string }[] =
    sortMode === "recommend"
      ? [
          { value: "default", label: t("sortRecommend") },
          { value: "price-asc", label: t("sortPriceAsc") },
          { value: "price-desc", label: t("sortPriceDesc") },
        ]
      : [
          { value: "default", label: t("sortDefault") },
          { value: "price-asc", label: t("sortPriceAsc") },
          { value: "price-desc", label: t("sortPriceDesc") },
          { value: "name", label: t("sortName") },
        ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-surface-2 pb-4">
        <h1 className="font-display text-2xl font-semibold text-accent">{heading}</h1>
        <select
          value={sort}
          aria-label={t("sortBy")}
          onChange={(e) => {
            setSort(e.target.value as SortOption);
            if (pageSize) setVisibleCount(pageSize);
          }}
          className="rounded-lg border border-surface-2 bg-white px-4 py-2 text-sm outline-none focus:border-brand"
        >
          {sortChoices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="py-20 text-center text-muted">{t("noProducts")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {pageSize && shown.length < sorted.length && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + pageSize)}
                className="rounded-xl border border-surface-2 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                {t("loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
