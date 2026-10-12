export type ProductCategory =
  | "drinks"
  | "snacks"
  | "noodles"
  | "specialty"
  | "hot-drinks"
  | "seasonings"
  | "side-dishes"
  | "drygoods"
  | "frozen"
  | "seafood"
  | "daily-essentials"
  | "shoes"
  | "case-discount";

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
  isPublished: boolean;
  createdAt: string;
  sortOrder: number;
  category: ProductCategory;
  categoryName: string;
  categoryRoute: string;
}

export interface CategoryInfo {
  slug: ProductCategory;
  route: string;
  nameZh: string;
  nameRu: string;
  nameUz: string;
  descriptionRu: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { slug: "drinks", route: "/products/drinks", nameZh: "饮料", nameRu: "Напитки", nameUz: "Ichimliklar", descriptionRu: "Напитки · соки · чай" },
  { slug: "snacks", route: "/products/snacks", nameZh: "零食", nameRu: "Снеки", nameUz: "Gazaklar", descriptionRu: "Печенье · чипсы · закуски" },
  { slug: "noodles", route: "/products/noodles", nameZh: "泡面", nameRu: "Быстрая лапша", nameUz: "Tez tayyor lag'mon", descriptionRu: "Лапша · готовые блюда" },
  { slug: "specialty", route: "/products/specialty", nameZh: "特色食品", nameRu: "Китайские продукты", nameUz: "Xitoy mahsulotlari", descriptionRu: "Популярные товары из Китая" },
  { slug: "hot-drinks", route: "/products/hot-drinks", nameZh: "热饮/茶", nameRu: "Китайский чай", nameUz: "Xitoy choyi", descriptionRu: "Чай · горячие напитки" },
  { slug: "seasonings", route: "/products/seasonings", nameZh: "调料", nameRu: "Приправы", nameUz: "Ziravorlar", descriptionRu: "Соусы · специи · приправы" },
  { slug: "side-dishes", route: "/products/side-dishes", nameZh: "配菜", nameRu: "Закуски", nameUz: "Garnirlar", descriptionRu: "Овощи · консервы · тофу" },
  { slug: "drygoods", route: "/products/drygoods", nameZh: "干货", nameRu: "Бакалея", nameUz: "Quruq mahsulotlar", descriptionRu: "Лапша · водоросли · фучжу" },
  { slug: "frozen", route: "/products/frozen", nameZh: "冷冻", nameRu: "Замороженное тесто", nameUz: "Muzlatilgan", descriptionRu: "Пельмени · вонтоны · танъюань" },
  { slug: "seafood", route: "/products/seafood", nameZh: "海鲜", nameRu: "Морепродукты", nameUz: "Dengiz mahsulotlari", descriptionRu: "Рыба · креветки · морепродукты" },
  { slug: "daily-essentials", route: "/products/daily-essentials", nameZh: "日用百货", nameRu: "Бытовые товары", nameUz: "Kundalik buyumlar", descriptionRu: "Уход · бумага · уборка" },
  { slug: "shoes", route: "/products/shoes", nameZh: "鞋类特卖", nameRu: "Распродажа обуви", nameUz: "Oyoq kiyim chegirmasi", descriptionRu: "Избранная обувь · скидки" },
  { slug: "case-discount", route: "/products/case-discount", nameZh: "整箱优惠", nameRu: "Выгодно коробкой", nameUz: "Quti bo'yicha arzon", descriptionRu: "Коробками дешевле" },
];

export function getCategoryInfo(slug: ProductCategory): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
