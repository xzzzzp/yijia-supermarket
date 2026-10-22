import type { CreateOrderRequest, OrderItem } from "@/types/order";
import type { Product } from "@/types/product";
import { validateCustomerContact } from "@/lib/order-contact";
import { getProductName, getProductSpec } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function buildOrderItems(
  items: { productId: string; quantity: number }[],
  products: Product[],
  locale: Locale,
): OrderItem[] {
  return items
    .map(({ productId, quantity }) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return null;

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
  } else {
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

export function validateOrderRequest(body: Partial<CreateOrderRequest>): string | null {
  if (!body.requestToken || body.requestToken.length < 8) {
    return "订单请求标识无效。";
  }
  if (!body.items?.length) {
    return "购物车为空。";
  }
  if (!body.channel || !["wechat", "telegram"].includes(body.channel)) {
    return "下单渠道无效。";
  }
  return validateCustomerContact(body);
}
