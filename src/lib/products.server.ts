import "server-only";

import { randomUUID } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { listCategories } from "@/lib/categories.server";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { mapProductRow, SEED_PRODUCTS } from "@/lib/products";
import type { ProductInput } from "@/types/admin";
import { productToRow } from "@/types/admin";
import type { Product } from "@/types/product";

interface ProductRow extends RowDataPacket {
  id: string;
  source_key: string;
  name: string;
  name_ru: string;
  name_uz: string;
  spec: string;
  spec_ru: string;
  spec_uz: string;
  image: string;
  price: number;
  in_stock: number;
  is_new: number;
  is_published: number;
  sort_order: number;
  category: string;
  created_at: Date | string;
}

function mapDbProduct(row: ProductRow, categoryNames?: ReadonlyMap<string, string>): Product {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  return mapProductRow(
    {
      ...row,
      in_stock: Boolean(row.in_stock),
      is_new: Boolean(row.is_new),
      is_published: Boolean(row.is_published),
      created_at: createdAt,
    },
    categoryNames,
  );
}

async function loadCategoryNames(): Promise<Map<string, string>> {
  try {
    const { categories } = await listCategories();
    return new Map(categories.map((category) => [category.slug, category.nameZh]));
  } catch (err) {
    console.error("Failed to load category names for products:", err);
    return new Map();
  }
}

export async function fetchProducts(): Promise<Product[]> {
  if (!isMysqlConfigured()) return SEED_PRODUCTS;

  const [rows, categoryNames] = await Promise.all([
    mysqlQuery<ProductRow[]>(
      "SELECT * FROM products WHERE is_published = 1 ORDER BY sort_order ASC, created_at ASC",
    ),
    loadCategoryNames(),
  ]);
  return rows.map((row) => mapDbProduct(row, categoryNames));
}

export async function fetchAllProducts(): Promise<Product[]> {
  if (!isMysqlConfigured()) return SEED_PRODUCTS;

  const [rows, categoryNames] = await Promise.all([
    mysqlQuery<ProductRow[]>("SELECT * FROM products ORDER BY sort_order ASC, created_at ASC"),
    loadCategoryNames(),
  ]);
  return rows.map((row) => mapDbProduct(row, categoryNames));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isMysqlConfigured()) {
    return SEED_PRODUCTS.find((product) => product.id === id) ?? null;
  }

  const [rows, categoryNames] = await Promise.all([
    mysqlQuery<ProductRow[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [id]),
    loadCategoryNames(),
  ]);
  return rows[0] ? mapDbProduct(rows[0], categoryNames) : null;
}

function bindProduct(input: ProductInput) {
  const row = productToRow(input);
  return [
    row.source_key,
    row.name,
    row.name_ru,
    row.name_uz,
    row.spec,
    row.spec_ru,
    row.spec_uz,
    row.image,
    row.price,
    row.in_stock ? 1 : 0,
    row.is_new ? 1 : 0,
    row.is_published ? 1 : 0,
    row.sort_order,
    row.category,
  ];
}

export async function insertProduct(input: ProductInput): Promise<string> {
  const id = randomUUID();
  await mysqlExecute(
    `INSERT INTO products (
       id, source_key, name, name_ru, name_uz, spec, spec_ru, spec_uz, image,
       price, in_stock, is_new, is_published, sort_order, category
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ...bindProduct(input)],
  );
  return id;
}

export async function updateProductRecord(id: string, input: ProductInput): Promise<void> {
  const result: ResultSetHeader = await mysqlExecute(
    `UPDATE products SET
       source_key = ?, name = ?, name_ru = ?, name_uz = ?, spec = ?, spec_ru = ?, spec_uz = ?,
       image = ?, price = ?, in_stock = ?, is_new = ?, is_published = ?, sort_order = ?, category = ?
     WHERE id = ?`,
    [...bindProduct(input), id],
  );
  if (result.affectedRows === 0) {
    throw new Error("未找到该商品");
  }
}

export async function deleteProductRecord(id: string): Promise<void> {
  const result = await mysqlExecute("DELETE FROM products WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    throw new Error("未找到该商品");
  }
}

export async function updateImportedProduct(
  id: string,
  fields: { price: number; category: string | null; inStock: boolean | null },
): Promise<void> {
  const sets = ["price = ?"];
  const params: Array<string | number> = [fields.price];
  if (fields.category) {
    sets.push("category = ?");
    params.push(fields.category);
  }
  if (fields.inStock != null) {
    sets.push("in_stock = ?");
    params.push(fields.inStock ? 1 : 0);
  }
  params.push(id);
  const result = await mysqlExecute(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`, params);
  if (result.affectedRows === 0) {
    throw new Error("未找到该商品");
  }
}

export async function updateProductImage(id: string, image: string): Promise<void> {
  const result = await mysqlExecute("UPDATE products SET image = ? WHERE id = ?", [image, id]);
  if (result.affectedRows === 0) {
    throw new Error("未找到该商品");
  }
}
