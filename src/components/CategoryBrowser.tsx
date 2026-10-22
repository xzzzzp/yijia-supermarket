"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryName } from "@/lib/i18n";
import type { CategoryInfo, Product } from "@/types/product";
import { useLanguage } from "@/providers/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";

export function CategoryBrowser({
  categories,
  products,
  initialSlug,
}: {
  categories: CategoryInfo[];
  products: Product[];
  initialSlug?: string;
}) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const fallback = categories[0]?.slug ?? "";
  const urlSlug =
    initialSlug && categories.some((category) => category.slug === initialSlug) ? initialSlug : fallback;
  const [override, setOverride] = useState<string | null>(null);
  const [seenSlug, setSeenSlug] = useState(urlSlug);
  if (urlSlug !== seenSlug) {
    setSeenSlug(urlSlug);
    setOverride(null);
  }
  const slug = override ?? urlSlug;

  if (!categories.length) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-5 py-16">
        <p className="rounded-2xl border border-surface-2 bg-white px-8 py-10 text-center text-muted">
          {t("categoryEmpty")}
        </p>
      </main>
    );
  }

  const selected = categories.find((category) => category.slug === slug) ?? categories[0];
  const visible = products.filter((product) => product.category === selected.slug && product.isPublished);

  const choose = (next: string) => {
    setOverride(next);
    router.replace(`/categories?c=${encodeURIComponent(next)}`, { scroll: false });
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl items-start">
      <aside className="sticky top-14 max-h-[calc(100vh-3.5rem-4.5rem)] w-[5.75rem] shrink-0 overflow-y-auto border-r border-surface-2 bg-white md:max-h-[calc(100vh-3.5rem)] md:w-48">
        <h1 className="sr-only">{t("navCategories")}</h1>
        <ul>
          {categories.map((category) => {
            const active = category.slug === selected.slug;
            return (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => choose(category.slug)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full border-l-2 px-2 py-3 text-left text-xs leading-4 font-semibold md:px-4 md:text-sm ${
                    active
                      ? "border-brand bg-brand-light text-brand"
                      : "border-transparent text-ink hover:bg-surface"
                  }`}
                >
                  {getCategoryName(locale, category)}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <section className="min-w-0 flex-1 px-3 py-4 sm:px-5">
        <h2 className="font-display text-lg font-semibold text-accent md:text-2xl">
          {getCategoryName(locale, selected)}
        </h2>
        {visible.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-surface-2 bg-white px-6 py-10 text-center text-sm text-muted">
            {t("noProducts")}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
