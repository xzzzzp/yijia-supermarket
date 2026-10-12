export interface LocalizedText {
  ru: string;
  uz: string;
  zh: string;
}

export interface StoreSettings {
  minOrderAmount: number;
  siteTagline: LocalizedText;
  businessHoursOpen: number;
  businessHoursClose: number;
  businessHoursText: LocalizedText;
  contactDesc: LocalizedText;
  storeName: string;
  address: string;
  phone: string;
  phoneDisplay: string;
  wechat: string;
  telegram: string;
  whatsapp: string;
}
