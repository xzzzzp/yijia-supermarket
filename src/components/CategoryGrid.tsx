"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { productImageSrc } from "@/lib/assets";
import { categoriesForHome, categoryMark } from "@/lib/categories";
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

function CategoryMark({ name, icon, color }: { name: string; icon: string; color: string }) {
  const mark = categoryMark(name, icon);
  const [failed, setFailed] = useState(false);
  const frame = "h-8 w-8 rounded-lg md:h-12 md:w-12 md:rounded-xl";

  if (mark.kind === "letter" || failed) {
    const letter = mark.kind === "letter" ? mark.letter : name.trim().charAt(0).toUpperCase();
    return (
      <span className={`flex items-center justify-center text-xs font-bold md:text-lg ${frame} ${color}`}>
        {letter}
      </span>
    );
  }

  return (
    <span className={`relative block overflow-hidden bg-surface ${frame}`}>
      <Image
        src={productImageSrc(mark.src)}
        alt=""
        fill
        unoptimized
        sizes="48px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function CategoryGrid({ categories }: { categories: CategoryInfo[] }) {
  const { locale, t } = useLanguage();
  const visible = categoriesForHome(categories);

  return (
    <section className="border-b border-surface-2 bg-surface px-5 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-xl font-semibold text-accent">{t("popularCategories")}</h2>
        <div className="scroll-rail mt-3 grid grid-cols-6 gap-1 overflow-x-hidden md:mt-4 md:flex md:gap-3 md:overflow-x-auto md:pb-2">
          {visible.map((cat, i) => {
            const name = getCategoryName(locale, cat);
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

            return (
              <Link
                key={cat.slug}
                href={cat.route}
                className="group flex min-w-0 flex-col items-center gap-1 rounded-xl border border-transparent bg-white p-1.5 transition hover:border-brand/30 hover:shadow-md md:w-28 md:shrink-0 md:gap-2 md:rounded-2xl md:p-4"
              >
                <CategoryMark name={name} icon={cat.icon} color={color} />
                <span className="w-full truncate text-center text-[10px] leading-4 font-semibold text-ink group-hover:text-brand md:hidden">
                  {name}
                </span>
                <span className="hidden text-center text-xs leading-4 font-semibold text-ink group-hover:text-brand md:line-clamp-2">
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
