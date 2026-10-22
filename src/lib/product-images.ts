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

async function readIfInside(root: string, category: string, filename: string): Promise<string | null> {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, category, filename);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) return null;

  try {
    await access(resolved);
    return resolved;
  } catch {
    return null;
  }
}

export async function resolveStoredProductImage(
  category: string,
  filename: string,
): Promise<string | null> {
  if (!isSafeImageSegment(category) || !isSafeImageSegment(filename)) return null;
  if (!productImageContentType(filename)) return null;

  // 目录前缀写成字面量，避免动态根路径把整个仓库打进 server trace。
  const durable = await readIfInside(
    path.join(process.cwd(), "data", "uploads", "products"),
    category,
    filename,
  );
  if (durable) return durable;

  // 旧版本写在 public/products/<分类>/。next start 不提供启动后才出现的 public 文件，这里仍按磁盘读取。
  return readIfInside(path.join(process.cwd(), "public", "products"), category, filename);
}
