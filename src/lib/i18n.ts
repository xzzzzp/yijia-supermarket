import type { OrderStatus } from "@/types/order";

export type Locale = "ru" | "uz" | "zh";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "ru", label: "Русский", short: "Русский" },
  { code: "uz", label: "O\u02BBbekcha", short: "O\u02BBbekcha" },
  { code: "zh", label: "中文", short: "中文" },
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
  | "orderSuccess"
  | "orderSaveHint"
  | "copyOrder"
  | "storeIntro"
  | "noProducts"
  | "sortBy"
  | "sortDefault"
  | "sortRecommend"
  | "sortPriceAsc"
  | "sortPriceDesc"
  | "sortName"
  | "loadMore"
  | "navHome"
  | "navCategories"
  | "navOrders"
  | "checkout"
  | "checkoutTitle"
  | "selectAll"
  | "unitPrice"
  | "lineTotal"
  | "rememberAddress"
  | "orderLookupTitle"
  | "orderLookupHint"
  | "orderNumber"
  | "lookupSubmit"
  | "lookupNotFound"
  | "deliveryInfo"
  | "specLabel"
  | "statusLabel"
  | "placedAt"
  | "completedAt"
  | "goCheckout"
  | "nothingSelected"
  | "categoryEmpty"
  | "backToCart"
  | "purchaseList"
  | "contactRequired"
  | "copied";

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
    orderSuccess: "Заказ отправлен",
    orderSaveHint: "Заказ отправлен. Скопируйте текст или сделайте скриншот, чтобы сохранить информацию о заказе.",
    copyOrder: "Скопировать заказ",
    storeIntro: "О магазине",
    noProducts: "Товары не найдены",
    sortBy: "Сортировка",
    sortDefault: "По умолчанию",
    sortRecommend: "Рекомендации",
    sortPriceAsc: "Цена ↑",
    sortPriceDesc: "Цена ↓",
    sortName: "По названию",
    loadMore: "Показать ещё",
    navHome: "Главная",
    navCategories: "Категории",
    navOrders: "Заказы",
    checkout: "Оформить",
    checkoutTitle: "Оформление",
    selectAll: "Выбрать все",
    unitPrice: "Цена",
    lineTotal: "Сумма",
    rememberAddress: "Запомнить адрес",
    orderLookupTitle: "Поиск заказа",
    orderLookupHint: "Введите телефон, указанный при оформлении, и номер заказа. Заказ откроется только если совпали оба.",
    orderNumber: "Номер заказа",
    lookupSubmit: "Найти",
    lookupNotFound: "Заказ не найден. Проверьте номер заказа и телефон",
    deliveryInfo: "Доставка",
    specLabel: "Фасовка",
    statusLabel: "Статус",
    placedAt: "Создан",
    completedAt: "Завершён",
    goCheckout: "К оформлению",
    nothingSelected: "Выберите товары",
    categoryEmpty: "Нет доступных категорий",
    backToCart: "Вернуться в корзину",
    purchaseList: "Состав заказа",
    contactRequired: "Укажите имя, телефон и адрес",
    copied: "Скопировано",
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
    orderSuccess: "Buyurtma yuborildi",
    orderSaveHint: "Buyurtma yuborildi. Buyurtma ma’lumotini saqlash uchun nusxa oling yoki skrinshot qiling.",
    copyOrder: "Buyurtmani nusxalash",
    storeIntro: "Do‘kon haqida",
    noProducts: "Mahsulot topilmadi",
    sortBy: "Saralash",
    sortDefault: "Standart",
    sortRecommend: "Tavsiya tartibi",
    sortPriceAsc: "Narx ↑",
    sortPriceDesc: "Narx ↓",
    sortName: "Nomi bo'yicha",
    loadMore: "Yana ko‘rsatish",
    navHome: "Bosh sahifa",
    navCategories: "Toifalar",
    navOrders: "Buyurtmalar",
    checkout: "Rasmiylashtirish",
    checkoutTitle: "Rasmiylashtirish",
    selectAll: "Hammasini tanlash",
    unitPrice: "Narx",
    lineTotal: "Summa",
    rememberAddress: "Manzilni eslab qolish",
    orderLookupTitle: "Buyurtmani qidirish",
    orderLookupHint: "Buyurtma berishda ko‘rsatilgan telefon va buyurtma raqamini kiriting. Ikkalasi mos kelsa, buyurtma ochiladi.",
    orderNumber: "Buyurtma raqami",
    lookupSubmit: "Qidirish",
    lookupNotFound: "Buyurtma topilmadi. Raqam va telefonni tekshiring",
    deliveryInfo: "Yetkazib berish",
    specLabel: "O‘lchami",
    statusLabel: "Holat",
    placedAt: "Yaratilgan",
    completedAt: "Yakunlangan",
    goCheckout: "Rasmiylashtirish",
    nothingSelected: "Mahsulotlarni tanlang",
    categoryEmpty: "Mavjud toifalar yo‘q",
    backToCart: "Savatga qaytish",
    purchaseList: "Xarid ro‘yxati",
    contactRequired: "Ism, telefon va manzilni kiriting",
    copied: "Nusxa olindi",
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
    orderSuccess: "订单已提交",
    orderSaveHint: "订单已提交，请复制或截图保存订单信息",
    copyOrder: "复制订单内容",
    storeIntro: "店铺介绍",
    noProducts: "未找到商品",
    sortBy: "排序",
    sortDefault: "默认",
    sortRecommend: "推荐排序",
    sortPriceAsc: "价格 ↑",
    sortPriceDesc: "价格 ↓",
    sortName: "按名称",
    loadMore: "加载更多",
    navHome: "首页",
    navCategories: "分类",
    navOrders: "订单",
    checkout: "去结算",
    checkoutTitle: "结算",
    selectAll: "全选",
    unitPrice: "单价",
    lineTotal: "小计",
    rememberAddress: "记住地址",
    orderLookupTitle: "订单查询",
    orderLookupHint: "请同时填写下单电话和订单号。两项都与订单一致时才能查看。",
    orderNumber: "订单号",
    lookupSubmit: "查询",
    lookupNotFound: "没有找到订单，请核对订单号和下单电话",
    deliveryInfo: "配送信息",
    specLabel: "规格",
    statusLabel: "状态",
    placedAt: "下单时间",
    completedAt: "完成时间",
    goCheckout: "去结算",
    nothingSelected: "请先勾选要结算的商品",
    categoryEmpty: "暂无可用分类",
    backToCart: "返回购物车",
    purchaseList: "购买清单",
    contactRequired: "请填写姓名、电话和配送地址",
    copied: "已复制",
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
  if (locale === "zh") return `最低起送 ${formatted} som`;
  if (locale === "uz") return `Minimal buyurtma: ${formatted} som`;
  return `Минимальная сумма заказа: ${formatted} som`;
}

export function formatMinOrderNotMet(locale: Locale, remaining: number): string {
  const formatted = remaining.toLocaleString("ru-RU");
  if (locale === "zh") return `还差 ${formatted} som 才能下单`;
  if (locale === "uz") return `Buyurtma berish uchun yana ${formatted} som kerak`;
  return `Для заказа не хватает ${formatted} som`;
}

const ORDER_STATUS_TEXT: Record<Locale, Record<OrderStatus, string>> = {
  ru: {
    pending: "Ожидает подтверждения",
    confirmed: "Подтверждён",
    delivering: "В доставке",
    completed: "Завершён",
  },
  uz: {
    pending: "Tasdiqlash kutilmoqda",
    confirmed: "Tasdiqlangan",
    delivering: "Yetkazilmoqda",
    completed: "Yakunlangan",
  },
  zh: {
    pending: "待确认",
    confirmed: "已确认",
    delivering: "配送中",
    completed: "已完成",
  },
};

export function orderStatusLabel(locale: Locale, status: OrderStatus): string {
  return ORDER_STATUS_TEXT[locale][status];
}
