/** 顾客看到的价格单位。库存数字不换算，只改展示文字。 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("ru-RU")} som`;
}
