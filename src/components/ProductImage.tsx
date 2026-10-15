"use client";

import Image from "next/image";
import { onProductImageError, productImageSrc } from "@/lib/assets";

interface ProductImageProps {
  image?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}

/** 本地 /products 图片跳过优化器，避免 basePath 与 SVG/损坏文件导致 400。 */
export function ProductImage({ image, alt, className, sizes }: ProductImageProps) {
  const src = productImageSrc(image);
  const remote = src.startsWith("http://") || src.startsWith("https://");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={!remote}
      className={className}
      onError={onProductImageError}
    />
  );
}
