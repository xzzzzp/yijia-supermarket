import "server-only";

import { access } from "fs/promises";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

/** 运行时上传目录。data/ 已被部署 rsync 排除，重启或再次部署都不会丢掉。 */
export function durableProductImageDir(): string {
  return path.join(process.cwd(), "data", "uploads", "products");
}

/** 旧版本写在 public/products。next start 不会对外提供启动后才出现的文件，但磁盘上的旧图仍要能读。 */
export function legacyProductImageDir(): string {
  return path.join(process.cwd(), "public", "products");
}

export function productImageContentType(filename: string): string | null {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? null;
}

export function isSafeImageSegment(value: string): boolean {
  if (!value || value.length > 180) return false;
  if (value.includes("..") || value.includes("/") || value.includes("\\") || value.includes("\0")) {
    return false;
  }
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

export async function resolveStoredProductImage(
  category: string,
  filename: string,
): Promise<string | null> {
  if (!isSafeImageSegment(category) || !isSafeImageSegment(filename)) return null;
  if (!productImageContentType(filename)) return null;

  for (const root of [durableProductImageDir(), legacyProductImageDir()]) {
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(root, category, filename);
    if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) return null;

    try {
      await access(resolved);
      return resolved;
    } catch {
      // 这个目录没有该文件，继续找旧目录。
    }
  }

  return null;
}
