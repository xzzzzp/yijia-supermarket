import type { LocalizedText, StoreSettings } from "@/types/settings";
import { STORE_CONFIG } from "@/lib/config";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  minOrderAmount: 0,
  siteTagline: {
    ru: "Китайские продукты, напитки, снеки, приправы и замороженные товары с доставкой по Ташкенту.",
    uz: "Toshkent bo'ylab yetkazib berish bilan Xitoy mahsulotlari, ichimliklar, gazaklar va muzlatilgan mahsulotlar.",
    zh: "塔什干华人超市，中国商品、饮料、零食、调料、冷冻食品，支持市内配送。",
  },
  businessHoursOpen: STORE_CONFIG.businessHours.open,
  businessHoursClose: STORE_CONFIG.businessHours.close,
  businessHoursText: {
    ru: "Ежедневно 09:00–01:00",
    uz: "Har kuni 09:00–01:00",
    zh: "每日 09:00–01:00",
  },
  contactDesc: {
    ru: "По вопросам о товарах, доставке или заказах свяжитесь с нами удобным способом.",
    uz: "Mahsulotlar, yetkazib berish yoki buyurtmalar bo'yicha biz bilan bog'laning.",
    zh: "如有商品、配送或订单问题，请通过以下方式联系我们。",
  },
  storeName: STORE_CONFIG.name,
  address: STORE_CONFIG.address,
  phone: STORE_CONFIG.phone,
  phoneDisplay: STORE_CONFIG.phoneDisplay,
  wechat: STORE_CONFIG.wechat,
  telegram: STORE_CONFIG.telegram,
  whatsapp: STORE_CONFIG.whatsapp,
};

export function mergeLocalized(
  partial: Partial<LocalizedText> | undefined,
  fallback: LocalizedText,
): LocalizedText {
  return {
    ru: partial?.ru?.trim() || fallback.ru,
    uz: partial?.uz?.trim() || fallback.uz,
    zh: partial?.zh?.trim() || fallback.zh,
  };
}

export function mergeStoreSettings(partial?: Partial<StoreSettings> | null): StoreSettings {
  const defaults = DEFAULT_STORE_SETTINGS;
  if (!partial) return { ...defaults };

  return {
    minOrderAmount: Math.max(0, Math.floor(Number(partial.minOrderAmount) || defaults.minOrderAmount)),
    siteTagline: mergeLocalized(partial.siteTagline, defaults.siteTagline),
    businessHoursOpen: clampHour(partial.businessHoursOpen ?? defaults.businessHoursOpen),
    businessHoursClose: clampHour(partial.businessHoursClose ?? defaults.businessHoursClose),
    businessHoursText: mergeLocalized(partial.businessHoursText, defaults.businessHoursText),
    contactDesc: mergeLocalized(partial.contactDesc, defaults.contactDesc),
    storeName: partial.storeName?.trim() || defaults.storeName,
    address: partial.address?.trim() || defaults.address,
    phone: partial.phone?.trim() || defaults.phone,
    phoneDisplay: partial.phoneDisplay?.trim() || defaults.phoneDisplay,
    wechat: partial.wechat?.trim() || defaults.wechat,
    telegram: partial.telegram?.replace(/^@/, "").trim() || defaults.telegram,
    whatsapp: partial.whatsapp?.trim() || defaults.whatsapp,
  };
}

export function clampHour(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(23, Math.max(0, Math.floor(value)));
}

export function pickLocalized(text: LocalizedText, locale: "ru" | "uz" | "zh"): string {
  if (locale === "zh") return text.zh || text.ru;
  if (locale === "uz") return text.uz || text.ru;
  return text.ru;
}

export function parseStoreSettingsForm(formData: FormData): StoreSettings {
  const localized = (prefix: string): LocalizedText => ({
    zh: String(formData.get(`${prefix}Zh`) ?? "").trim(),
    ru: String(formData.get(`${prefix}Ru`) ?? "").trim(),
    uz: String(formData.get(`${prefix}Uz`) ?? "").trim(),
  });

  return mergeStoreSettings({
    minOrderAmount: Number(formData.get("minOrderAmount")),
    siteTagline: localized("siteTagline"),
    businessHoursOpen: Number(formData.get("businessHoursOpen")),
    businessHoursClose: Number(formData.get("businessHoursClose")),
    businessHoursText: localized("businessHoursText"),
    contactDesc: localized("contactDesc"),
    storeName: String(formData.get("storeName") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    phoneDisplay: String(formData.get("phoneDisplay") ?? ""),
    wechat: String(formData.get("wechat") ?? ""),
    telegram: String(formData.get("telegram") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  });
}

/** 塔什干当地小时（0–23）。部分运行时在午夜会给出 24，这里折回 0。 */
export function getTashkentHour(date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const value = Number(hour);
  if (!Number.isFinite(value)) return 0;
  return value % 24;
}

export function isStoreOpenNow(settings: Pick<StoreSettings, "businessHoursOpen" | "businessHoursClose">): boolean {
  const hour = getTashkentHour();
  const { businessHoursOpen: open, businessHoursClose: close } = settings;
  return hour >= open || hour < close;
}
