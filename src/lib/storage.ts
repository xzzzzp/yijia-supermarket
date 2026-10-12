import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const BUCKET = "products";

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadProductImage(
  file: File,
  category: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = sanitizeFilename(file.name);
  const storagePath = `${category}/${filename}`;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

    if (error) {
      throw new Error(`上传失败: ${error.message}`);
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  // 本地开发：写入 public/products/
  const publicDir = path.join(process.cwd(), "public", "products", category);
  await mkdir(publicDir, { recursive: true });
  const filePath = path.join(publicDir, filename);
  await writeFile(filePath, buffer);
  return `/products/${category}/${filename}`;
}

export function matchProductByFilename(
  filename: string,
  products: Array<{ id: string; sourceKey: string; image: string; name: string }>,
): { id: string; name: string } | null {
  const base = filename.replace(/\.[^.]+$/, "").toLowerCase();
  const fullLower = filename.toLowerCase();

  for (const p of products) {
    const imageBase = p.image.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase();
    if (imageBase === base || p.image.toLowerCase().endsWith(fullLower)) {
      return { id: p.id, name: p.name };
    }
    if (p.sourceKey.toLowerCase().includes(base)) {
      return { id: p.id, name: p.name };
    }
  }
  return null;
}
