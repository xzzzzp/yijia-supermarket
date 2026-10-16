import "server-only";

import { listNotificationRecipients } from "@/lib/staff.server";

/**
 * 新订单通知钩子。
 * 接单通知目前只是店员能力开关：这里找出店主和开启了该能力的店员。
 * 推送、铃声、红点尚未接入。
 */
export async function dispatchNewOrderNotification(orderId: string): Promise<void> {
  try {
    const recipients = await listNotificationRecipients();
    console.info("[order-notifications] new order", {
      orderId,
      recipients: recipients.map((member) => member.email),
    });
  } catch (err) {
    console.warn("[order-notifications] hook failed:", err);
  }
}
