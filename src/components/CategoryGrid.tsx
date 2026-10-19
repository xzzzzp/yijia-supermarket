"use client";

import Link from "next/link";
import { categoriesForHome } from "@/lib/categories";
import { getCategoryName } from "@/lib/i18n";
import type { CategoryInfo } from "@/types/product";
import { useLanguage } from "@/providers/LanguageProvider";

const CATEGORY_COLORS = [
  "bg-orange-100 text-orange-800",
  "bg-amber-100 text-amber-800",
  "bg-teal-100 text-teal-800",
  "bg-indigo-100 text-indigo-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
  "bg-lime-100 text-lime-800",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-fuchsia-100 text-fuchsia-800",
  "bg-emerald-100 text-emerald-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
];

export function CategoryGrid({ categories }: { categories: CategoryInfo[] }) {
  const { locale, t } = useLanguage();
  const visible = categoriesForHome(categories);

  return (
    <section className="border-b border-surface-2 bg-surface px-5 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-xl font-semibold text-accent">{t("popularCategories")}</h2>
        <div className="scroll-rail mt-4 flex gap-3 overflow-x-auto pb-2">
          {visible.map((cat, i) => {
            const name = getCategoryName(locale, cat);
            const initial = name.charAt(0).toUpperCase();
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

            return (
              <Link
                key={cat.slug}
                href={cat.route}
                className="group flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border border-transparent bg-white p-4 transition hover:border-brand/30 hover:shadow-md"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${color}`}
                >
                  {initial}
                </span>
                <span className="line-clamp-2 text-center text-xs font-semibold leading-4 text-ink group-hover:text-brand">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
