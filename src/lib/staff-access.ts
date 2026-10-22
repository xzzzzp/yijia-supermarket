import type { AdminSession, StaffCapabilities, StaffRecord } from "@/types/staff";

export const EMPTY_CAPABILITIES: StaffCapabilities = {
  orderNotifications: false,
  viewStats: false,
  fulfillment: false,
  manageProducts: false,
};

export function capabilitiesFor(
  staff: Pick<
    StaffRecord,
    "isOwner" | "orderNotifications" | "viewStats" | "fulfillment" | "manageProducts"
  >,
): StaffCapabilities {
  if (staff.isOwner) {
    return {
      orderNotifications: true,
      viewStats: true,
      fulfillment: true,
      manageProducts: true,
    };
  }

  return {
    orderNotifications: staff.orderNotifications,
    viewStats: staff.viewStats,
    fulfillment: staff.fulfillment,
    manageProducts: staff.manageProducts,
  };
}

export function hasCapability(
  session: Pick<AdminSession, "isOwner" | "capabilities">,
  capability: keyof StaffCapabilities,
): boolean {
  return session.isOwner || session.capabilities[capability];
}

/** 配货、看统计、接单通知均可打开订单列表。营收本身在「数据统计」，只认 viewStats。 */
export function canViewOrders(session: Pick<AdminSession, "isOwner" | "capabilities">): boolean {
  return (
    hasCapability(session, "fulfillment") ||
    hasCapability(session, "viewStats") ||
    hasCapability(session, "orderNotifications")
  );
}

export function adminRoleLabel(session: Pick<AdminSession, "isOwner" | "capabilities">): string {
  if (session.isOwner) return "店主";
  if (!canViewOrders(session) && !hasCapability(session, "manageProducts")) return "未授权";
  return "店员";
}
