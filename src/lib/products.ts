import type { Product, ProductCategory } from "@/types/product";
import { getCategoryInfo } from "@/types/product";

export {
  HOME_NEW_PRODUCT_LIMIT,
  NEW_PRODUCT_PAGE_SIZE,
  compareRecommendSort,
  filterNewProducts,
  homeNewProducts,
  sortProducts,
  type ProductSortMode,
  type SortOption,
} from "@/lib/recommend-products";

export const SEED_PRODUCTS: Product[] = [
  {
    id: "seed-001",
    sourceKey: "noodles::ksf-braised::康师傅红烧牛肉面::105g",
    name: "康师傅红烧牛肉面（桶）",
    nameRu: "Kangshifu лапша быстрого приготовления с тушёной говядиной (стакан)",
    nameUz: "Kangshifu qovurilgan mol go'shti lag'moni (stakan)",
    spec: "105g",
    specRu: "105 г",
    specUz: "105 g",
    image: "/products/placeholder.png",
    price: 12000,
    inStock: true,
    isNew: true,
    recommendSort: 30,
    isPublished: true,
    createdAt: "2026-01-15",
    sortOrder: 0,
    category: "noodles",
    categoryName: "泡面",
    categoryRoute: "/products/noodles",
  },
  {
    id: "seed-002",
    sourceKey: "drinks::coconut-palm::椰树牌椰汁::245ml",
    name: "椰树牌椰汁",
    nameRu: "Кокосовый сок Coconut Palm",
    nameUz: "Coconut Palm kokos sharbati",
    spec: "245ml",
    specRu: "245 мл",
    specUz: "245 ml",
    image: "/products/placeholder.png",
    price: 15000,
    inStock: true,
    isNew: true,
    recommendSort: 10,
    isPublished: true,
    createdAt: "2026-01-20",
    sortOrder: 1,
    category: "drinks",
    categoryName: "饮料",
    categoryRoute: "/products/drinks",
  },
  {
    id: "seed-003",
    sourceKey: "snacks::extra-gum::Extra口香糖::56g",
    name: "Extra口香糖（薄荷）",
    nameRu: "Extra жевательная резинка, мята",
    nameUz: "Extra mentolli saqich",
    spec: "56g",
    specRu: "56 г",
    specUz: "56 g",
    image: "/products/placeholder.png",
    price: 18000,
    inStock: true,
    isNew: true,
    recommendSort: 40,
    isPublished: true,
    createdAt: "2026-01-22",
    sortOrder: 2,
    category: "snacks",
    categoryName: "零食",
    categoryRoute: "/products/snacks",
  },
  {
    id: "seed-004",
    sourceKey: "seasonings::haitian-soy::海天生抽::500ml",
    name: "海天生抽酱油",
    nameRu: "Haitian светлый соевый соус",
    nameUz: "Haitian och soy sousi",
    spec: "500ml",
    specRu: "500 мл",
    specUz: "500 ml",
    image: "/products/placeholder.png",
    price: 22000,
    inStock: true,
    isNew: false,
    recommendSort: 0,
    isPublished: true,
    createdAt: "2026-01-10",
    sortOrder: 3,
    category: "seasonings",
    categoryName: "调料",
    categoryRoute: "/products/seasonings",
  },
  {
    id: "seed-005",
    sourceKey: "frozen::synear-dumpling::思念灌汤水饺::三鲜",
    name: "思念灌汤水饺（三鲜）",
    nameRu: "Synear сочные пельмени с тройной начинкой",
    nameUz: "Synear suvli chuchvara (uch xil)",
    spec: "455g",
    specRu: "455 г",
    specUz: "455 g",
    image: "/products/placeholder.png",
    price: 35000,
    inStock: true,
    isNew: false,
    recommendSort: 0,
    isPublished: true,
    createdAt: "2026-01-08",
    sortOrder: 4,
    category: "frozen",
    categoryName: "冷冻",
    categoryRoute: "/products/frozen",
  },
  {
    id: "seed-006",
    sourceKey: "seafood::frozen-shrimp::冷冻虾仁::2kg",
    name: "冷冻虾仁 2kg",
    nameRu: "Свежемороженые креветки",
    nameUz: "Muzlatilgan qisqichbaqa",
    spec: "2kg",
    specRu: "2 кг",
    specUz: "2 kg",
    image: "/products/placeholder.png",
    price: 85000,
    inStock: true,
    isNew: true,
    recommendSort: 20,
    isPublished: true,
    createdAt: "2026-01-25",
    sortOrder: 5,
    category: "seafood",
    categoryName: "海鲜",
    categoryRoute: "/products/seafood",
  },
];

export function filterByCategory(
  products: Product[],
  category: ProductCategory,
): Product[] {
  return products.filter((p) => p.category === category && p.isPublished);
}

export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products.filter((p) => p.isPublished);

  return products.filter(
    (p) =>
      p.isPublished &&
      [p.name, p.nameRu, p.nameUz, p.spec, p.specRu, p.categoryName]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ru-RU")} UZS`;
}

function finiteRecommendSort(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function mapProductRow(
  row: Record<string, unknown>,
  categoryNames?: ReadonlyMap<string, string>,
): Product {
  const category = String(row.category ?? "");
  const catInfo = getCategoryInfo(category);

  return {
    id: row.id as string,
    sourceKey: row.source_key as string,
    name: row.name as string,
    nameRu: row.name_ru as string,
    nameUz: row.name_uz as string,
    spec: row.spec as string,
    specRu: row.spec_ru as string,
    specUz: row.spec_uz as string,
    image: row.image as string,
    price: row.price as number,
    inStock: row.in_stock as boolean,
    isNew: row.is_new as boolean,
    recommendSort: finiteRecommendSort(row.recommend_sort),
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as string,
    sortOrder: row.sort_order as number,
    category,
    categoryName: categoryNames?.get(category) || catInfo?.nameZh || category,
    categoryRoute: `/products/${category}`,
  };
}
