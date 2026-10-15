"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/products";
import { getProductName } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { ProductImage } from "@/components/ProductImage";

interface NewProductsCarouselProps {
  products: Product[];
}

export function NewProductsCarousel({ products }: NewProductsCarouselProps) {
  const { locale, t } = useLanguage();

  if (!products.length) return null;

  return (
    <section className="bg-white px-5 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">New arrivals</p>
            <h2 className="font-display mt-1 text-xl font-semibold text-accent">{t("newProducts")}</h2>
          </div>
          <Link
            href="/products/new"
            className="shrink-0 text-sm font-semibold text-brand transition hover:text-brand-dark"
          >
            {t("viewAll")} →
          </Link>
        </div>

        <div className="scroll-rail mt-5 flex gap-4 overflow-x-auto pb-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.categoryRoute}
              className="group w-36 shrink-0 sm:w-44"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface border border-surface-2">
                <ProductImage
                  image={product.image}
                  alt={getProductName(locale, product)}
                  className="object-contain p-3 transition group-hover:scale-105"
                  sizes="180px"
                />
                {product.isNew && (
                  <span className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-4 text-ink group-hover:text-brand">
                {getProductName(locale, product)}
              </p>
              <p className="mt-1 text-sm font-bold text-brand">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
