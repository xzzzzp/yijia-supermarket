/** 分类 slug。新品页占用 `new`，不能当作商品分类。 */
export type ProductCategory = string;

export interface Product {
  id: string;
  sourceKey: string;
  name: string;
  nameRu: string;
  nameUz: string;
  spec: string;
  specRu: string;
  specUz: string;
  image: string;
  price: number;
  inStock: boolean;
  isNew: boolean;
  /** 新品推荐顺序。越小越靠前。未勾选新品推荐时不进入推荐池。 */
  recommendSort: number;
  isPublished: boolean;
  createdAt: string;
  sortOrder: number;
  category: ProductCategory;
  categoryName: string;
  categoryRoute: string;
}

export interface CategoryInfo {
  slug: string;
  route: string;
  nameZh: string;
  nameRu: string;
  nameUz: string;
  description: string;
  sortOrder: number;
  showOnHome: boolean;
  enabled: boolean;
}

/** 未配置 MySQL 或分类表尚未建立时的内置分类。与 mysql 种子数据保持一致。 */
export const CATEGORIES: CategoryInfo[] = [
  { slug: "drinks", route: "/products/drinks", nameZh: "饮料", nameRu: "Напитки", nameUz: "Ichimliklar", description: "Напитки · соки · чай", sortOrder: 10, showOnHome: true, enabled: true },
  { slug: "snacks", route: "/products/snacks", nameZh: "零食", nameRu: "Снеки", nameUz: "Gazaklar", description: "Печенье · чипсы · закуски", sortOrder: 20, showOnHome: true, enabled: true },
  { slug: "noodles", route: "/products/noodles", nameZh: "泡面", nameRu: "Быстрая лапша", nameUz: "Tez tayyor lag'mon", description: "Лапша · готовые блюда", sortOrder: 30, showOnHome: true, enabled: true },
  { slug: "specialty", route: "/products/specialty", nameZh: "特色食品", nameRu: "Китайские продукты", nameUz: "Xitoy mahsulotlari", description: "Популярные товары из Китая", sortOrder: 40, showOnHome: true, enabled: true },
  { slug: "hot-drinks", route: "/products/hot-drinks", nameZh: "热饮/茶", nameRu: "Китайский чай", nameUz: "Xitoy choyi", description: "Чай · горячие напитки", sortOrder: 50, showOnHome: true, enabled: true },
  { slug: "seasonings", route: "/products/seasonings", nameZh: "调料", nameRu: "Приправы", nameUz: "Ziravorlar", description: "Соусы · специи · приправы", sortOrder: 60, showOnHome: true, enabled: true },
  { slug: "side-dishes", route: "/products/side-dishes", nameZh: "配菜", nameRu: "Закуски", nameUz: "Garnirlar", description: "Овощи · консервы · тофу", sortOrder: 70, showOnHome: true, enabled: true },
  { slug: "drygoods", route: "/products/drygoods", nameZh: "干货", nameRu: "Бакалея", nameUz: "Quruq mahsulotlar", description: "Лапша · водоросли · фучжу", sortOrder: 80, showOnHome: true, enabled: true },
  { slug: "frozen", route: "/products/frozen", nameZh: "冷冻", nameRu: "Замороженное тесто", nameUz: "Muzlatilgan", description: "Пельмени · вонтоны · танъюань", sortOrder: 90, showOnHome: true, enabled: true },
  { slug: "seafood", route: "/products/seafood", nameZh: "海鲜", nameRu: "Морепродукты", nameUz: "Dengiz mahsulotlari", description: "Рыба · креветки · морепродукты", sortOrder: 100, showOnHome: true, enabled: true },
  { slug: "daily-essentials", route: "/products/daily-essentials", nameZh: "日用百货", nameRu: "Бытовые товары", nameUz: "Kundalik buyumlar", description: "Уход · бумага · уборка", sortOrder: 110, showOnHome: true, enabled: true },
  { slug: "shoes", route: "/products/shoes", nameZh: "鞋类特卖", nameRu: "Распродажа обуви", nameUz: "Oyoq kiyim chegirmasi", description: "Избранная обувь · скидки", sortOrder: 120, showOnHome: true, enabled: true },
  { slug: "case-discount", route: "/products/case-discount", nameZh: "整箱优惠", nameRu: "Выгодно коробкой", nameUz: "Quti bo'yicha arzon", description: "Коробками дешевле", sortOrder: 130, showOnHome: true, enabled: true },
];

export function getCategoryInfo(slug: ProductCategory): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
