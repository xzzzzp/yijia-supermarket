import { categoryIconError, categoryMark } from "@/lib/category-mark";
import { CATEGORIES, type CategoryInfo } from "@/types/product";

export { categoryMark };

export interface CategoryInput {
  slug: string;
  nameZh: string;
  nameRu: string;
  nameUz: string;
  description: string;
  icon: string;
  sortOrder: number;
  showOnHome: boolean;
  enabled: boolean;
}

export interface AdminCategory extends CategoryInfo {
  productCount: number;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["new"]);

export function categoryRoute(slug: string): string {
  return `/products/${slug}`;
}

export function sortCategories<T extends Pick<CategoryInfo, "sortOrder" | "slug">>(categories: T[]): T[] {
  return [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug),
  );
}

function asCategoryInfo(category: CategoryInfo): CategoryInfo {
  return {
    slug: category.slug,
    route: category.route,
    nameZh: category.nameZh,
    nameRu: category.nameRu,
    nameUz: category.nameUz,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sortOrder,
    showOnHome: category.showOnHome,
    enabled: category.enabled,
  };
}

/** 首页热门分类：启用且打开首页显示。 */
export function categoriesForHome(categories: CategoryInfo[]): CategoryInfo[] {
  return sortCategories(categories.filter((category) => category.enabled && category.showOnHome)).map(asCategoryInfo);
}

/** 商品表单、批量导入目录：仅已启用分类。 */
export function categoriesForProductForm(categories: CategoryInfo[]): CategoryInfo[] {
  return sortCategories(categories.filter((category) => category.enabled)).map(asCategoryInfo);
}

export function parseCategoryForm(formData: FormData): CategoryInput {
  const sortOrder = Number(formData.get("sortOrder"));
  return {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    nameZh: String(formData.get("nameZh") ?? "").trim(),
    nameRu: String(formData.get("nameRu") ?? "").trim(),
    nameUz: String(formData.get("nameUz") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    icon: String(formData.get("icon") ?? "").trim(),
    sortOrder,
    showOnHome: formData.getAll("showOnHome").includes("1"),
    enabled: formData.getAll("enabled").includes("1"),
  };
}

export function validateCategoryInput(input: CategoryInput): string | null {
  if (!input.slug) return "slug 不能为空";
  if (input.slug.length > 64) return "slug 不能超过 64 个字符";
  if (!SLUG_PATTERN.test(input.slug)) {
    return "slug 只能使用小写字母、数字和连字符，且不能以连字符开头或结尾";
  }
  if (RESERVED_SLUGS.has(input.slug)) return "slug「new」留给新品页，不能用作分类";
  if (!input.nameZh) return "中文名称不能为空";
  if (!input.nameRu) return "俄语名称不能为空";
  if (!input.nameUz) return "乌兹别克语名称不能为空";
  if ([input.nameZh, input.nameRu, input.nameUz].some((name) => name.length > 255)) {
    return "名称不能超过 255 个字符";
  }
  if (input.description.length > 512) return "描述不能超过 512 个字符";
  const iconError = categoryIconError(input.icon);
  if (iconError) return iconError;
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < -1_000_000 || input.sortOrder > 1_000_000) {
    return "排序必须是 -1000000 到 1000000 之间的整数";
  }
  return null;
}

export function categoryAssignmentMessage(category: CategoryInfo | null | undefined): string | null {
  if (!category) return "请选择已有分类";
  if (!category.enabled) return "该分类已停用，不能选作商品分类。请先启用，或改到其他分类。";
  return null;
}

export function categoryRemovalMessage(productCount: number, action: "删除" | "停用"): string | null {
  if (productCount <= 0) return null;
  return `该分类下仍有 ${productCount} 个商品，请先把这些商品改到其他分类后再${action}。`;
}

export function toCategoryInfo(input: CategoryInput): CategoryInfo {
  return {
    slug: input.slug,
    route: categoryRoute(input.slug),
    nameZh: input.nameZh,
    nameRu: input.nameRu,
    nameUz: input.nameUz,
    description: input.description,
    icon: input.icon,
    sortOrder: input.sortOrder,
    showOnHome: input.showOnHome,
    enabled: input.enabled,
  };
}

export function defaultCategories(): CategoryInfo[] {
  return CATEGORIES.map((category) => ({ ...category }));
}
