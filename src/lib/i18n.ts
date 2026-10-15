export type Locale = "ru" | "uz" | "zh";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "ru", label: "Русский", short: "RU" },
  { code: "uz", label: "O'zbek", short: "UZ" },
  { code: "zh", label: "中文", short: "ZH" },
];

type TranslationKey =
  | "siteName"
  | "siteTagline"
  | "cart"
  | "search"
  | "searchPlaceholder"
  | "businessHours"
  | "openDaily"
  | "checkingStatus"
  | "openNow"
  | "closedNow"
  | "newProducts"
  | "viewAll"
  | "popularCategories"
  | "ourServices"
  | "personalShopping"
  | "personalShoppingDesc"
  | "delivery"
  | "deliveryDesc"
  | "contactUs"
  | "contactDesc"
  | "phone"
  | "copy"
  | "open"
  | "findUs"
  | "storeName"
  | "address"
  | "addToCart"
  | "inStock"
  | "outOfStock"
  | "cartEmpty"
  | "cartTitle"
  | "total"
  | "submitOrder"
  | "submitMessage"
  | "clearCart"
  | "quantity"
  | "remove"
  | "customerName"
  | "customerPhone"
  | "customerAddress"
  | "note"
  | "contactRequired"
  | "orderSuccess"
  | "noProducts"
  | "sortBy"
  | "sortDefault"
  | "sortPriceAsc"
  | "sortPriceDesc"
  | "sortName";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  ru: {
    siteName: "Yijia Chinese Supermarket",
    siteTagline: "Китайские продукты, напитки, снеки, приправы и замороженные товары с доставкой по Ташкенту.",
    cart: "Корзина",
    search: "Поиск товаров",
    searchPlaceholder: "Например: лапша, кола, соус",
    businessHours: "Режим работы",
    openDaily: "Ежедневно 09:00–01:00",
    checkingStatus: "Проверяем статус…",
    openNow: "Сейчас открыто",
    closedNow: "Сейчас закрыто",
    newProducts: "Новинки",
    viewAll: "Смотреть все →",
    popularCategories: "Популярные категории",
    ourServices: "Наши услуги",
    personalShopping: "Покупки по поручению",
    personalShoppingDesc: "Поможем купить нужные товары в пределах Ташкента.",
    delivery: "Доставка по Ташкенту",
    deliveryDesc: "Закажите товары магазина с доставкой по Ташкенту.",
    contactUs: "Связаться с нами",
    contactDesc: "По вопросам о товарах, доставке или заказах свяжитесь с нами удобным способом.",
    phone: "Телефон",
    copy: "Копировать",
    open: "Открыть",
    findUs: "Как нас найти",
    storeName: "Название магазина",
    address: "Адрес",
    addToCart: "В корзину",
    inStock: "В наличии",
    outOfStock: "Нет в наличии",
    cartEmpty: "Корзина пуста",
    cartTitle: "Корзина",
    total: "Итого",
    submitOrder: "Оформить заказ",
    submitMessage: "Отправить сообщение",
    clearCart: "Очистить",
    quantity: "Количество",
    remove: "Удалить",
    customerName: "Имя",
    customerPhone: "Телефон",
    customerAddress: "Адрес доставки",
    note: "Комментарий",
    contactRequired: "Укажите имя, телефон и адрес доставки",
    orderSuccess: "Заказ отправлен",
    noProducts: "Товары не найдены",
    sortBy: "Сортировка",
    sortDefault: "По умолчанию",
    sortPriceAsc: "Цена ↑",
    sortPriceDesc: "Цена ↓",
    sortName: "По названию",
  },
  uz: {
    siteName: "Yijia Chinese Supermarket",
    siteTagline: "Toshkent bo'ylab yetkazib berish bilan Xitoy mahsulotlari, ichimliklar, gazaklar va muzlatilgan mahsulotlar.",
    cart: "Savat",
    search: "Mahsulot qidirish",
    searchPlaceholder: "Masalan: lag'mon, kola, sous",
    businessHours: "Ish vaqti",
    openDaily: "Har kuni 09:00–01:00",
    checkingStatus: "Holat tekshirilmoqda…",
    openNow: "Hozir ochiq",
    closedNow: "Hozir yopiq",
    newProducts: "Yangi mahsulotlar",
    viewAll: "Hammasini ko'rish →",
    popularCategories: "Mashhur toifalar",
    ourServices: "Xizmatlarimiz",
    personalShopping: "Buyurtma bo'yicha xarid",
    personalShoppingDesc: "Toshkent ichida kerakli mahsulotlarni sotib olishda yordam beramiz.",
    delivery: "Toshkent bo'ylab yetkazib berish",
    deliveryDesc: "Do'kon mahsulotlarini Toshkent bo'ylab yetkazib berish bilan buyurtma qiling.",
    contactUs: "Biz bilan bog'laning",
    contactDesc: "Mahsulotlar, yetkazib berish yoki buyurtmalar bo'yicha biz bilan bog'laning.",
    phone: "Telefon",
    copy: "Nusxalash",
    open: "Ochish",
    findUs: "Bizni qanday topish mumkin",
    storeName: "Do'kon nomi",
    address: "Manzil",
    addToCart: "Savatga",
    inStock: "Mavjud",
    outOfStock: "Mavjud emas",
    cartEmpty: "Savat bo'sh",
    cartTitle: "Savat",
    total: "Jami",
    submitOrder: "Buyurtma berish",
    submitMessage: "Xabar yuborish",
    clearCart: "Tozalash",
    quantity: "Miqdor",
    remove: "O'chirish",
    customerName: "Ism",
    customerPhone: "Telefon",
    customerAddress: "Yetkazib berish manzili",
    note: "Izoh",
    contactRequired: "Ism, telefon va manzilni kiriting",
    orderSuccess: "Buyurtma yuborildi",
    noProducts: "Mahsulot topilmadi",
    sortBy: "Saralash",
    sortDefault: "Standart",
    sortPriceAsc: "Narx ↑",
    sortPriceDesc: "Narx ↓",
    sortName: "Nomi bo'yicha",
  },
  zh: {
    siteName: "亿佳华人超市",
    siteTagline: "塔什干华人超市，中国商品、饮料、零食、调料、冷冻食品，支持市内配送。",
    cart: "购物车",
    search: "搜索商品",
    searchPlaceholder: "例如：泡面、可乐、酱油",
    businessHours: "营业时间",
    openDaily: "每日 09:00–01:00",
    checkingStatus: "正在检查营业状态…",
    openNow: "营业中",
    closedNow: "已打烊",
    newProducts: "新品推荐",
    viewAll: "查看全部 →",
    popularCategories: "热门分类",
    ourServices: "我们的服务",
    personalShopping: "代购服务",
    personalShoppingDesc: "帮您在塔什干范围内购买所需商品。",
    delivery: "塔什干配送",
    deliveryDesc: "超市商品支持塔什干市内配送。",
    contactUs: "联系我们",
    contactDesc: "如有商品、配送或订单问题，请通过以下方式联系我们。",
    phone: "电话",
    copy: "复制",
    open: "打开",
    findUs: "如何找到我们",
    storeName: "店铺名称",
    address: "地址",
    addToCart: "加入购物车",
    inStock: "有货",
    outOfStock: "缺货",
    cartEmpty: "购物车为空",
    cartTitle: "购物车",
    total: "合计",
    submitOrder: "提交订单",
    submitMessage: "发送消息",
    clearCart: "清空",
    quantity: "数量",
    remove: "删除",
    customerName: "姓名",
    customerPhone: "电话",
    customerAddress: "配送地址",
    note: "备注",
    contactRequired: "请填写姓名、电话和配送地址",
    orderSuccess: "订单已提交",
    noProducts: "未找到商品",
    sortBy: "排序",
    sortDefault: "默认",
    sortPriceAsc: "价格 ↑",
    sortPriceDesc: "价格 ↓",
    sortName: "按名称",
  },
};

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.ru[key] ?? key;
}

export function getProductName(
  locale: Locale,
  product: { name: string; nameRu: string; nameUz: string },
): string {
  if (locale === "zh") return product.name;
  if (locale === "uz") return product.nameUz || product.nameRu;
  return product.nameRu || product.name;
}

export function getProductSpec(
  locale: Locale,
  product: { spec: string; specRu: string; specUz: string },
): string {
  if (locale === "zh") return product.spec;
  if (locale === "uz") return product.specUz || product.specRu;
  return product.specRu || product.spec;
}

export function getCategoryName(
  locale: Locale,
  category: { nameZh: string; nameRu: string; nameUz: string },
): string {
  if (locale === "zh") return category.nameZh;
  if (locale === "uz") return category.nameUz;
  return category.nameRu;
}

export function getDefaultChannel(locale: Locale): "wechat" | "telegram" {
  return locale === "zh" ? "wechat" : "telegram";
}

export function formatMinOrderHint(locale: Locale, amount: number): string {
  const formatted = amount.toLocaleString("ru-RU");
  if (locale === "zh") return `最低起送 ${formatted} UZS`;
  if (locale === "uz") return `Minimal buyurtma: ${formatted} UZS`;
  return `Минимальная сумма заказа: ${formatted} UZS`;
}

export function formatMinOrderNotMet(locale: Locale, remaining: number): string {
  const formatted = remaining.toLocaleString("ru-RU");
  if (locale === "zh") return `还差 ${formatted} UZS 才能下单`;
  if (locale === "uz") return `Buyurtma berish uchun yana ${formatted} UZS kerak`;
  return `Для заказа не хватает ${formatted} UZS`;
}
