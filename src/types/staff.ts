export interface StaffCapabilities {
  orderNotifications: boolean;
  viewStats: boolean;
  fulfillment: boolean;
  manageProducts: boolean;
}

export interface StaffRecord {
  id: string;
  authUserId: string | null;
  email: string;
  displayName: string;
  isOwner: boolean;
  orderNotifications: boolean;
  viewStats: boolean;
  fulfillment: boolean;
  manageProducts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSession {
  id: string;
  email: string;
  staffId: string | null;
  isOwner: boolean;
  capabilities: StaffCapabilities;
}

export type StaffStoreSource = "mysql" | "local";

export interface StaffDirectory {
  source: StaffStoreSource;
  staff: StaffRecord[];
  warning?: string;
  /** MySQL 已配置但读取失败。此时不能把空列表当成「还没有店主」。 */
  unavailable?: boolean;
}
