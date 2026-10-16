import type { CreateOrderRequest, OrderItem } from "@/types/order";
import type { Product } from "@/types/product";
import { getProductName, getProductSpec } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export const MAX_ORDER_QUANTITY = 99;
export const MAX_ORDER_LINES = 40;

export function buildOrderItems(
  items: { productId: string; quantity: number }[],
  products: Product[],
  locale: Locale,
): OrderItem[] {
  return items
    .map(({ productId, quantity }) => {
      const product = products.find((p) => p.id === productId);
      if (!product || !product.isPublished || !product.inStock) return null;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ORDER_QUANTITY) {
        return null;
      }

      return {
        productId,
        name: getProductName(locale, product),
        spec: getProductSpec(locale, product),
        price: product.price,
        quantity,
      };
    })
    .filter(Boolean) as OrderItem[];
}

export function buildOrderText(
  items: OrderItem[],
  locale: Locale,
  extra?: { name?: string; phone?: string; address?: string; note?: string },
): string {
  const lines: string[] = [];
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (locale === "zh") {
    lines.push("【亿佳超市 订单】");
    items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. ${item.name} (${item.spec}) x${item.quantity} — ${item.price.toLocaleString()} UZS`,
      );
    });
    lines.push(`合计：${total.toLocaleString()} UZS`);
    if (extra?.name) lines.push(`姓名：${extra.name}`);
    if (extra?.phone) lines.push(`电话：${extra.phone}`);
    if (extra?.address) lines.push(`地址：${extra.address}`);
    if (extra?.note) lines.push(`备注：${extra.note}`);
  } else if (locale === "uz") {
    lines.push("【Yijia Supermarket — Buyurtma】");
    items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. ${item.name} (${item.spec}) x${item.quantity} — ${item.price.toLocaleString()} UZS`,
      );
    });
    lines.push(`Jami: ${total.toLocaleString()} UZS`);
    if (extra?.name) lines.push(`Ism: ${extra.name}`);
    if (extra?.phone) lines.push(`Telefon: ${extra.phone}`);
    if (extra?.address) lines.push(`Manzil: ${extra.address}`);
    if (extra?.note) lines.push(`Izoh: ${extra.note}`);
  } else {
    lines.push("【Yijia Supermarket — Заказ】");
    items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. ${item.name} (${item.spec}) x${item.quantity} — ${item.price.toLocaleString()} UZS`,
      );
    });
    lines.push(`Итого: ${total.toLocaleString()} UZS`);
    if (extra?.name) lines.push(`Имя: ${extra.name}`);
    if (extra?.phone) lines.push(`Телефон: ${extra.phone}`);
    if (extra?.address) lines.push(`Адрес: ${extra.address}`);
    if (extra?.note) lines.push(`Комментарий: ${extra.note}`);
  }

  return lines.join("\n");
}

/** 下单成功后始终回到站内确认页。Telegram / 微信深链由确认页上的按钮打开。 */
export function getRedirectUrl(
  channel: CreateOrderRequest["channel"],
  orderText: string,
  orderId: string,
): string {
  const params = new URLSearchParams({
    channel,
    orderId,
    text: orderText,
  });
  return `/order/success?${params.toString()}`;
}

export function getTelegramShareUrl(username: string, text: string): string {
  const handle = username.replace(/^@/, "").trim();
  const params = new URLSearchParams({ text });
  return `https://t.me/${handle}?${params.toString()}`;
}

export function resolveOrderLocale(body: Partial<CreateOrderRequest>): Locale {
  if (body.locale === "zh" || body.locale === "uz" || body.locale === "ru") {
    return body.locale;
  }
  return body.channel === "wechat" ? "zh" : "ru";
}

function orderMessage(
  locale: Locale,
  messages: Record<Locale, string>,
): string {
  return messages[locale];
}

export function validateOrderRequest(
  body: Partial<CreateOrderRequest>,
  locale: Locale = "zh",
): string | null {
  if (!body.requestToken || body.requestToken.length < 8 || body.requestToken.length > 80) {
    return orderMessage(locale, {
      zh: "订单请求标识无效。",
      ru: "Некорректный идентификатор заказа.",
      uz: "Buyurtma identifikatori noto'g'ri.",
    });
  }
  if (!body.items?.length) {
    return orderMessage(locale, {
      zh: "购物车为空。",
      ru: "Корзина пуста.",
      uz: "Savat bo'sh.",
    });
  }
  if (body.items.length > MAX_ORDER_LINES) {
    return orderMessage(locale, {
      zh: "商品种类过多。",
      ru: "Слишком много позиций в заказе.",
      uz: "Buyurtmada juda ko'p mahsulot turi.",
    });
  }
  for (const item of body.items) {
    if (!item?.productId || typeof item.productId !== "string") {
      return orderMessage(locale, {
        zh: "商品无效。",
        ru: "Некорректный товар.",
        uz: "Mahsulot noto'g'ri.",
      });
    }
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_ORDER_QUANTITY
    ) {
      return orderMessage(locale, {
        zh: `每种商品数量需在 1 到 ${MAX_ORDER_QUANTITY} 之间。`,
        ru: `Количество каждой позиции: от 1 до ${MAX_ORDER_QUANTITY}.`,
        uz: `Har bir mahsulot soni 1 dan ${MAX_ORDER_QUANTITY} gacha bo'lishi kerak.`,
      });
    }
  }
  if (!body.channel || !["wechat", "telegram"].includes(body.channel)) {
    return orderMessage(locale, {
      zh: "下单渠道无效。",
      ru: "Некорректный канал заказа.",
      uz: "Buyurtma kanali noto'g'ri.",
    });
  }

  const name = body.customerName?.trim() ?? "";
  const phone = body.customerPhone?.trim() ?? "";
  const address = body.customerAddress?.trim() ?? "";
  const note = body.note?.trim() ?? "";

  if (name.length < 1 || name.length > 80) {
    return orderMessage(locale, {
      zh: "请填写姓名（80 字以内）。",
      ru: "Укажите имя (до 80 символов).",
      uz: "Ismni kiriting (80 belgigacha).",
    });
  }
  if (!/^[0-9+\-\s()]{5,32}$/.test(phone)) {
    return orderMessage(locale, {
      zh: "请填写有效电话。",
      ru: "Укажите корректный телефон.",
      uz: "To'g'ri telefon raqamini kiriting.",
    });
  }
  if (address.length < 4 || address.length > 200) {
    return orderMessage(locale, {
      zh: "请填写配送地址（4–200 字）。",
      ru: "Укажите адрес доставки (от 4 до 200 символов).",
      uz: "Yetkazib berish manzilini kiriting (4–200 belgi).",
    });
  }
  if (note.length > 500) {
    return orderMessage(locale, {
      zh: "备注过长。",
      ru: "Комментарий слишком длинный.",
      uz: "Izoh juda uzun.",
    });
  }

  return null;
}
