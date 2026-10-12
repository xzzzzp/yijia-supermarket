"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/products";
import { onProductImageError, productImageSrc } from "@/lib/assets";
import { getProductName, getProductSpec } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { AddToCartControl } from "@/components/AddToCartControl";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale } = useLanguage();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-surface-2 bg-white transition hover:border-brand/40 hover:shadow-lg">
      <div className="relative aspect-square bg-surface">
        <Image
          src={productImageSrc(product.image)}
          alt={getProductName(locale, product)}
          fill
          className="object-contain p-4 transition group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 50vw, 25vw"
          onError={onProductImageError}
        />
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            New
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-surface-2 p-3 sm:p-4">
        <Link
          href={product.categoryRoute}
          className="line-clamp-2 text-sm font-semibold text-ink transition group-hover:text-brand"
        >
          {getProductName(locale, product)}
        </Link>
        <p className="mt-1 text-xs text-muted">{getProductSpec(locale, product)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-display text-base font-bold text-brand">
            {formatPrice(product.price)}
          </span>
          <AddToCartControl productId={product.id} inStock={product.inStock} />
        </div>
      </div>
    </div>
  );
}
