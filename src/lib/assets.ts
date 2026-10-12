/** 静态资源路径（自动加 basePath，如 /yijia） */
export function assetPath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (base && (normalized === base || normalized.startsWith(`${base}/`))) {
    return normalized;
  }

  return `${base}${normalized}`;
}

export const PLACEHOLDER_IMAGE = "/products/placeholder.svg";

export function productImageSrc(image?: string | null): string {
  return assetPath(image?.trim() || PLACEHOLDER_IMAGE);
}

/** 图片加载失败时使用占位图，并防止 onError 死循环 */
export function onProductImageError(event: { currentTarget: HTMLImageElement }): void {
  const img = event.currentTarget;
  const fallback = productImageSrc(PLACEHOLDER_IMAGE);

  if (img.dataset.fallbackApplied === "1") {
    return;
  }

  img.dataset.fallbackApplied = "1";
  img.src = fallback;
}
