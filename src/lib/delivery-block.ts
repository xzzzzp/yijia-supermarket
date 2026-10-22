export function displayOrDash(value: string | null | undefined): string {
  const text = value?.trim() ?? "";
  return text || "—";
}

/** 配送信息整块。缺姓名、电话或地址时用「—」，方便直接粘贴给配送员。 */
export function formatDeliveryBlock(order: {
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
}): string {
  return [
    `姓名：${displayOrDash(order.customerName)}`,
    `电话：${displayOrDash(order.customerPhone)}`,
    `地址：${displayOrDash(order.customerAddress)}`,
  ].join("\n");
}
