import "server-only";

/** 配置了 Bot Token 和 Chat ID 时，把订单推送到店铺 Telegram。失败不阻断下单。 */
export async function notifyStore(orderText: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: orderText.slice(0, 4000),
      }),
    });

    if (!response.ok) {
      console.error("Telegram notify failed:", response.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Telegram notify failed:", err);
    return false;
  }
}
