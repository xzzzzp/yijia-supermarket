import "server-only";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  durableProductImageDir,
  isSafeImageSegment,
  productImageContentType,
} from "@/lib/product-images";

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadProductImage(
  file: File,
  category: string,
): Promise<string> {
  const safeCategory = category.trim();
  const filename = sanitizeFilename(file.name);
  if (
    !isSafeImageSegment(safeCategory) ||
    !isSafeImageSegment(filename) ||
    !productImageContentType(filename)
  ) {
    throw new Error("图片文件名或分类无效，仅支持 jpg、png、gif、webp、avif、svg");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(durableProductImageDir(), safeCategory);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  // 库存的仍是 /products/<分类>/<文件名>。前台用 assetPath 加上 basePath，路由按磁盘读取。
  return `/products/${safeCategory}/${filename}`;
}

export function matchProductByFilename(
  filename: string,
  products: Array<{ id: string; sourceKey: string; image: string; name: string }>,
): { id: string; name: string } | null {
  const base = filename.replace(/\.[^.]+$/, "").toLowerCase();
  const fullLower = filename.toLowerCase();

  for (const product of products) {
    const imageBase = product.image.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase();
    if (imageBase === base || product.image.toLowerCase().endsWith(fullLower)) {
      return { id: product.id, name: product.name };
    }
    if (product.sourceKey.toLowerCase().includes(base)) {
      return { id: product.id, name: product.name };
    }
  }
  return null;
}
