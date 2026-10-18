export const AUDIT_ACTIONS = [
  "login",
  "login.failed",
  "product.create",
  "product.update",
  "product.delete",
  "product.import",
  "product.image",
  "order.status",
  "staff.create",
  "staff.update",
  "staff.delete",
  "settings.save",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: "登录",
  "login.failed": "登录失败",
  "product.create": "新增商品",
  "product.update": "更新商品",
  "product.delete": "删除商品",
  "product.import": "批量导入图片",
  "product.image": "上传商品图片",
  "order.status": "订单状态变更",
  "staff.create": "新增店员",
  "staff.update": "更新店员",
  "staff.delete": "删除店员",
  "settings.save": "保存店铺设置",
};

export const AUDIT_TARGET_LABELS: Record<string, string> = {
  staff: "店员",
  product: "商品",
  order: "订单",
  store_settings: "店铺设置",
};

export interface AuditLogRecord {
  id: string;
  createdAt: string;
  actorEmail: string;
  actorStaffId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  ip: string | null;
}

export function auditActionLabel(action: string): string {
  return action in AUDIT_ACTION_LABELS ? AUDIT_ACTION_LABELS[action as AuditAction] : action;
}

export function auditTargetLabel(targetType: string): string {
  return AUDIT_TARGET_LABELS[targetType] ?? targetType;
}
