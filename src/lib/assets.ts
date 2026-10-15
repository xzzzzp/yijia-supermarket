import { getBasePath } from "@/lib/paths";

/** 静态资源路径（自动加 basePath，如 /yijia）。next/image 不会自动加 basePath。 */
export function assetPath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (base && (normalized === base || normalized.startsWith(`${base}/`))) {
    return normalized;
  }

  return `${base}${normalized}`;
}

export const PLACEHOLDER_IMAGE = "/products/placeholder.png";
const LEGACY_PLACEHOLDER = "/products/placeholder.svg";

export function productImageSrc(image?: string | null): string {
  let value = image?.trim() || PLACEHOLDER_IMAGE;
  const pathOnly = value.split("?")[0]?.split("#")[0] ?? value;

  if (pathOnly === LEGACY_PLACEHOLDER || pathOnly.endsWith("/products/placeholder.svg")) {
    value = PLACEHOLDER_IMAGE;
  }

  return assetPath(value);
}

/** 图片加载失败时使用占位图，并防止 onError 死循环 */
export function onProductImageError(event: { currentTarget: HTMLImageElement }): void {
  const img = event.currentTarget;
  const fallback = productImageSrc(PLACEHOLDER_IMAGE);

  if (img.dataset.fallbackApplied === "1" || img.src.endsWith(fallback)) {
    img.dataset.fallbackApplied = "1";
    return;
  }

  img.dataset.fallbackApplied = "1";
  img.src = fallback;
}
