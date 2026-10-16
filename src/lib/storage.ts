import "server-only";

import { writeFile, mkdir } from "fs/promises";
import path from "path";

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadProductImage(
  file: File,
  category: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = sanitizeFilename(file.name);
  const publicDir = path.join(process.cwd(), "public", "products", category);
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, filename), buffer);
  return `/products/${category}/${filename}`;
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
