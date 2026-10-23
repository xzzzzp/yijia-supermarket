export interface SheetProductRow {
  rowNumber: number;
  name: string;
  spec: string;
  price: number;
  /** null 表示这一格空着，更新时不改分类。 */
  category: string | null;
  /** null 表示这一格空着，更新时不改库存。 */
  inStock: boolean | null;
  /** null 表示列不存在或单元格为空，更新时不改对应译文。 */
  nameRu: string | null;
  nameUz: string | null;
  specRu: string | null;
  specUz: string | null;
}

export type ParsedSheetRow =
  | ({ ok: true } & SheetProductRow)
  | { ok: false; rowNumber: number; name: string; spec: string; message: string };

export interface ParsedProductSheet {
  error: string | null;
  rows: ParsedSheetRow[];
}

export interface ImportCatalogProduct {
  id: string;
  name: string;
  spec: string;
  category: string;
  inStock: boolean;
  createdAt: string;
}

export interface ImportCatalogCategory {
  slug: string;
  nameZh: string;
  nameRu: string;
  nameUz: string;
  enabled: boolean;
}

export type ProductImportPlan =
  | {
      kind: "create";
      rowNumber: number;
      name: string;
      nameRu: string | null;
      nameUz: string | null;
      spec: string;
      specRu: string | null;
      specUz: string | null;
      price: number;
      category: string;
      inStock: boolean;
    }
  | {
      kind: "update";
      rowNumber: number;
      productId: string;
      name: string;
      nameRu: string | null;
      nameUz: string | null;
      spec: string;
      specRu: string | null;
      specUz: string | null;
      price: number;
      category: string | null;
      inStock: boolean | null;
      warning: string | null;
    }
  | { kind: "fail"; rowNumber: number; name: string; spec: string; message: string };

type HeaderField =
  | "name"
  | "nameRu"
  | "nameUz"
  | "spec"
  | "specRu"
  | "specUz"
  | "price"
  | "category"
  | "stock";

const HEADER_FIELDS: Record<string, HeaderField> = {
  名称: "name",
  商品名称: "name",
  品名: "name",
  name: "name",
  中文名称: "name",
  namezh: "name",
  name_zh: "name",
  俄语名称: "nameRu",
  俄文名称: "nameRu",
  nameru: "nameRu",
  name_ru: "nameRu",
  乌兹别克语名称: "nameUz",
  乌兹别克名称: "nameUz",
  乌语名称: "nameUz",
  nameuz: "nameUz",
  name_uz: "nameUz",
  规格: "spec",
  商品规格: "spec",
  spec: "spec",
  中文规格: "spec",
  speczh: "spec",
  spec_zh: "spec",
  俄语规格: "specRu",
  俄文规格: "specRu",
  specru: "specRu",
  spec_ru: "specRu",
  乌兹别克语规格: "specUz",
  乌兹别克规格: "specUz",
  specuz: "specUz",
  spec_uz: "specUz",
  单价: "price",
  价格: "price",
  售价: "price",
  price: "price",
  分类: "category",
  类别: "category",
  category: "category",
  库存: "stock",
  有货: "stock",
  stock: "stock",
};

const IN_STOCK = new Set(["1", "true", "yes", "y", "有", "有货", "在售", "是"]);
const OUT_OF_STOCK = new Set(["0", "false", "no", "n", "无", "无货", "缺货", "否"]);

function headerToken(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function productIdentityKey(name: string, spec: string): string {
  const norm = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  return `${norm(name)}\n${norm(spec)}`;
}

/** 主图文件名（去掉扩展名）与「名称+规格」比较。空白忽略，不要求中间有加号。 */
export function nameSpecImageKey(name: string, spec: string): string {
  return `${name}${spec}`.replace(/\s+/g, "").toLowerCase();
}

export function fileImageKey(filename: string): string {
  const baseName = filename.split(/[/\\]/).pop() ?? filename;
  const withoutExt = baseName.replace(/\.[^.]+$/, "");
  return withoutExt.replace(/\s+/g, "").toLowerCase();
}

export function parsePriceCell(value: string): { price: number } | { error: string } {
  const compact = value.trim().replace(/[\s\u00a0]/g, "");
  if (!compact) return { error: "单价为空" };

  let digits = compact;
  if (/^\d{1,3}([.,]\d{3})+$/.test(compact)) {
    digits = compact.replace(/[.,]/g, "");
  }
  if (!/^\d+$/.test(digits)) return { error: `单价「${value.trim()}」须为整数 som` };

  const price = Number(digits);
  if (!Number.isSafeInteger(price)) return { error: "单价无效" };
  if (price > 1_000_000_000) return { error: "单价过大" };
  return { price };
}

export function parseStockCell(value: string): { inStock: boolean | null } | { error: string } {
  const raw = value.trim();
  if (!raw) return { inStock: null };
  const key = raw.toLowerCase();
  if (IN_STOCK.has(key)) return { inStock: true };
  if (OUT_OF_STOCK.has(key)) return { inStock: false };

  const numeric = raw.replace(/,/g, "");
  if (/^\d+(\.\d+)?$/.test(numeric)) {
    return { inStock: Number(numeric) > 0 };
  }
  return { error: `库存「${raw}」无法识别` };
}

export function resolveImportCategory(
  raw: string,
  categories: ImportCatalogCategory[],
): { slug: string } | { error: string } {
  const text = raw.trim();
  const key = text.toLowerCase();
  const found = categories.find(
    (category) =>
      category.slug.toLowerCase() === key ||
      category.nameZh.trim() === text ||
      category.nameRu.trim().toLowerCase() === key ||
      category.nameUz.trim().toLowerCase() === key,
  );
  if (!found) return { error: `分类「${text}」不存在` };
  if (!found.enabled) return { error: `分类「${found.nameZh}」已停用` };
  return { slug: found.slug };
}

function blankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

export function parseProductSheet(rows: string[][]): ParsedProductSheet {
  const headerIndex = rows.findIndex((row) => !blankRow(row));
  if (headerIndex < 0) return { error: "表格是空的", rows: [] };

  const header = rows[headerIndex].map(headerToken);
  const columns = new Map<HeaderField, number>();
  header.forEach((cell, index) => {
    const field = HEADER_FIELDS[cell];
    if (field && !columns.has(field)) columns.set(field, index);
  });

  const missing = ["名称", "规格", "单价"].filter((label, index) => {
    const field = (["name", "spec", "price"] as const)[index];
    return !columns.has(field);
  });
  if (missing.length) {
    return { error: `缺少必填列：${missing.join("、")}`, rows: [] };
  }

  const nameCol = columns.get("name")!;
  const specCol = columns.get("spec")!;
  const priceCol = columns.get("price")!;
  const categoryCol = columns.get("category");
  const stockCol = columns.get("stock");
  const textCol = (field: HeaderField, row: string[]): string | null => {
    const index = columns.get(field);
    if (index == null) return null;
    const value = (row[index] ?? "").trim();
    return value || null;
  };
  const parsed: ParsedSheetRow[] = [];

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    if (blankRow(row)) return;
    const rowNumber = headerIndex + offset + 2;
    const name = (row[nameCol] ?? "").trim();
    const spec = (row[specCol] ?? "").trim();
    const nameRu = textCol("nameRu", row);
    const nameUz = textCol("nameUz", row);
    const specRu = textCol("specRu", row);
    const specUz = textCol("specUz", row);
    const priceCell = parsePriceCell(row[priceCol] ?? "");
    const stockCell = stockCol == null ? { inStock: null as boolean | null } : parseStockCell(row[stockCol] ?? "");
    const category = categoryCol == null ? null : (row[categoryCol] ?? "").trim() || null;
    const translations = [nameRu, nameUz, specRu, specUz].filter((value): value is string => Boolean(value));

    if (!name) {
      parsed.push({ ok: false, rowNumber, name, spec, message: "名称为空" });
      return;
    }
    if (name.length > 255 || spec.length > 255 || translations.some((value) => value.length > 255)) {
      parsed.push({ ok: false, rowNumber, name, spec, message: "名称或规格超过 255 个字符" });
      return;
    }
    if ("error" in priceCell) {
      parsed.push({ ok: false, rowNumber, name, spec, message: priceCell.error });
      return;
    }
    if ("error" in stockCell) {
      parsed.push({ ok: false, rowNumber, name, spec, message: stockCell.error });
      return;
    }

    parsed.push({
      ok: true,
      rowNumber,
      name,
      spec,
      price: priceCell.price,
      category,
      inStock: stockCell.inStock,
      nameRu,
      nameUz,
      specRu,
      specUz,
    });
  });

  if (!parsed.length) return { error: "没有可导入的数据行", rows: [] };
  return { error: null, rows: parsed };
}

export function planProductImport(
  rows: ParsedSheetRow[],
  products: ImportCatalogProduct[],
  categories: ImportCatalogCategory[],
): ProductImportPlan[] {
  const working = products.map((product) => ({ ...product }));
  const plans: ProductImportPlan[] = [];

  for (const row of rows) {
    if (!row.ok) {
      plans.push({ kind: "fail", rowNumber: row.rowNumber, name: row.name, spec: row.spec, message: row.message });
      continue;
    }

    let categorySlug: string | null = null;
    if (row.category) {
      const resolved = resolveImportCategory(row.category, categories);
      if ("error" in resolved) {
        plans.push({
          kind: "fail",
          rowNumber: row.rowNumber,
          name: row.name,
          spec: row.spec,
          message: resolved.error,
        });
        continue;
      }
      categorySlug = resolved.slug;
    }

    const key = productIdentityKey(row.name, row.spec);
    const matches = working
      .filter((product) => productIdentityKey(product.name, product.spec) === key)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

    if (!matches.length) {
      if (!categorySlug) {
        plans.push({
          kind: "fail",
          rowNumber: row.rowNumber,
          name: row.name,
          spec: row.spec,
          message: "新建商品需要填写已启用的分类",
        });
        continue;
      }
      const inStock = row.inStock ?? true;
      plans.push({
        kind: "create",
        rowNumber: row.rowNumber,
        name: row.name,
        nameRu: row.nameRu,
        nameUz: row.nameUz,
        spec: row.spec,
        specRu: row.specRu,
        specUz: row.specUz,
        price: row.price,
        category: categorySlug,
        inStock,
      });
      working.push({
        id: `pending:${row.rowNumber}`,
        name: row.name,
        spec: row.spec,
        category: categorySlug,
        inStock,
        createdAt: "9999-12-31T00:00:00.000Z",
      });
      continue;
    }

    const target = matches[0];
    plans.push({
      kind: "update",
      rowNumber: row.rowNumber,
      productId: target.id,
      name: row.name,
      nameRu: row.nameRu,
      nameUz: row.nameUz,
      spec: row.spec,
      specRu: row.specRu,
      specUz: row.specUz,
      price: row.price,
      category: categorySlug,
      inStock: row.inStock,
      warning: matches.length > 1 ? `同名同规格有 ${matches.length} 条，只更新最早的一条` : null,
    });
    target.category = categorySlug ?? target.category;
    if (row.inStock != null) target.inStock = row.inStock;
  }

  return plans;
}
