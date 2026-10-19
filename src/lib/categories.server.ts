import "server-only";

import type { RowDataPacket } from "mysql2";
import {
  categoryRemovalMessage,
  defaultCategories,
  toCategoryInfo,
  type AdminCategory,
  type CategoryInput,
} from "@/lib/categories";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { SEED_PRODUCTS } from "@/lib/products";
import type { CategoryInfo } from "@/types/product";

const SCHEMA_HINT =
  "分类表尚未建立。请在 MySQL 中执行 mysql/migrations/20261018_product_categories.sql，或重新执行 mysql/schema.sql。";

interface CategoryRow extends RowDataPacket {
  slug: string;
  name_zh: string;
  name_ru: string;
  name_uz: string;
  description: string;
  sort_order: number;
  show_on_home: number;
  enabled: number;
  product_count?: number;
}

export interface CategoryDirectory {
  categories: AdminCategory[];
  source: "mysql" | "default";
  warning?: string;
}

function isMissingTable(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "ER_NO_SUCH_TABLE";
}

function mapRow(row: CategoryRow): CategoryInfo {
  return {
    slug: row.slug,
    route: `/products/${row.slug}`,
    nameZh: row.name_zh,
    nameRu: row.name_ru,
    nameUz: row.name_uz,
    description: row.description ?? "",
    sortOrder: Number(row.sort_order) || 0,
    showOnHome: Boolean(row.show_on_home),
    enabled: Boolean(row.enabled),
  };
}

function withSeedCounts(categories: CategoryInfo[]): AdminCategory[] {
  return categories.map((category) => ({
    ...category,
    productCount: SEED_PRODUCTS.filter((product) => product.category === category.slug).length,
  }));
}

export async function listCategories(): Promise<CategoryDirectory> {
  if (!isMysqlConfigured()) {
    return { categories: withSeedCounts(defaultCategories()), source: "default" };
  }

  try {
    const rows = await mysqlQuery<CategoryRow[]>(
      `SELECT
         c.slug, c.name_zh, c.name_ru, c.name_uz, c.description,
         c.sort_order, c.show_on_home, c.enabled,
         (SELECT COUNT(*) FROM products p WHERE p.category = c.slug) AS product_count
       FROM product_categories c
       ORDER BY c.sort_order ASC, c.slug ASC`,
    );
    return {
      categories: rows.map((row) => ({
        ...mapRow(row),
        productCount: Number(row.product_count) || 0,
      })),
      source: "mysql",
    };
  } catch (err) {
    if (isMissingTable(err)) {
      console.error("product_categories table is missing:", err);
      return {
        categories: withSeedCounts(defaultCategories()),
        source: "default",
        warning: SCHEMA_HINT,
      };
    }
    throw err;
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  const { categories } = await listCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

async function countProducts(slug: string): Promise<number> {
  const rows = await mysqlQuery<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM products WHERE category = ?",
    [slug],
  );
  return Number(rows[0]?.total) || 0;
}

export async function insertCategory(input: CategoryInput): Promise<void> {
  const category = toCategoryInfo(input);
  await mysqlExecute(
    `INSERT INTO product_categories (
       slug, name_zh, name_ru, name_uz, description, sort_order, show_on_home, enabled
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      category.slug,
      category.nameZh,
      category.nameRu,
      category.nameUz,
      category.description,
      category.sortOrder,
      category.showOnHome ? 1 : 0,
      category.enabled ? 1 : 0,
    ],
  );
}

export async function updateCategoryRecord(input: CategoryInput): Promise<void> {
  const existing = await mysqlQuery<CategoryRow[]>(
    "SELECT slug, name_zh, name_ru, name_uz, description, sort_order, show_on_home, enabled FROM product_categories WHERE slug = ? LIMIT 1",
    [input.slug],
  );
  if (!existing[0]) throw new Error("未找到该分类");

  if (!input.enabled && Boolean(existing[0].enabled)) {
    const blocked = categoryRemovalMessage(await countProducts(input.slug), "停用");
    if (blocked) throw new Error(blocked);
  }

  await mysqlExecute(
    `UPDATE product_categories SET
       name_zh = ?, name_ru = ?, name_uz = ?, description = ?,
       sort_order = ?, show_on_home = ?, enabled = ?
     WHERE slug = ?`,
    [
      input.nameZh,
      input.nameRu,
      input.nameUz,
      input.description,
      input.sortOrder,
      input.showOnHome ? 1 : 0,
      input.enabled ? 1 : 0,
      input.slug,
    ],
  );
}

export async function deleteCategoryRecord(slug: string): Promise<void> {
  const blocked = categoryRemovalMessage(await countProducts(slug), "删除");
  if (blocked) throw new Error(blocked);

  const result = await mysqlExecute("DELETE FROM product_categories WHERE slug = ?", [slug]);
  if (result.affectedRows === 0) {
    throw new Error("未找到该分类");
  }
}

export function categorySchemaHint(): string {
  return SCHEMA_HINT;
}
