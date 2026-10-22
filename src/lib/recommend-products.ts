/** 首页新品推荐最多展示的件数。 */
export const HOME_NEW_PRODUCT_LIMIT = 8;

/** 新品推荐页首屏件数，其余用「加载更多」。 */
export const NEW_PRODUCT_PAGE_SIZE = 24;

export interface RecommendSortable {
  id: string;
  isNew: boolean;
  isPublished: boolean;
  recommendSort: number;
  createdAt: string;
  price: number;
  sortOrder: number;
  nameRu: string;
}

export function compareRecommendSort(a: RecommendSortable, b: RecommendSortable): number {
  if (a.recommendSort !== b.recommendSort) return a.recommendSort - b.recommendSort;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/** 已上架且勾选新品推荐。顺序为推荐排序，越小越靠前。 */
export function filterNewProducts<T extends RecommendSortable>(products: T[]): T[] {
  return products.filter((product) => product.isNew && product.isPublished).sort(compareRecommendSort);
}

export function homeNewProducts<T extends RecommendSortable>(products: T[]): T[] {
  return filterNewProducts(products).slice(0, HOME_NEW_PRODUCT_LIMIT);
}

export type SortOption = "default" | "price-asc" | "price-desc" | "name";

/** catalog：分类列表按 sortOrder。recommend：新品推荐页默认按推荐排序。 */
export type ProductSortMode = "catalog" | "recommend";

export function sortProducts<T extends RecommendSortable>(
  products: T[],
  sort: SortOption,
  mode: ProductSortMode = "catalog",
): T[] {
  const sorted = [...products];
  const tie = mode === "recommend" ? compareRecommendSort : () => 0;
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price || tie(a, b));
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price || tie(a, b));
    case "name":
      return sorted.sort((a, b) => a.nameRu.localeCompare(b.nameRu));
    default:
      return mode === "recommend"
        ? sorted.sort(compareRecommendSort)
        : sorted.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
