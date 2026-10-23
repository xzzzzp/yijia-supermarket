import { requireAdmin } from "@/lib/admin-auth";
import { listInAppNotifications } from "@/lib/notifications.server";
import { canViewOrders, hasCapability } from "@/lib/staff-access";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { NotificationList } from "@/components/admin/NotificationList";

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();

  if (!user.staffId || !hasCapability(user, "orderNotifications")) {
    return (
      <AccessDenied message="没有接单通知权限。请联系店主在「店员权限」中打开接单通知。" />
    );
  }

  const { notifications, warning } = await listInAppNotifications(user.staffId);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">接单通知</h1>
        <p className="mt-1 text-sm text-slate-600">
          新订单会通知全部店主，以及打开了接单通知的店员。本页保持打开时会自动刷新；关掉再打开仍看得到以往的站内通知。
        </p>
      </div>
      {warning && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {warning}
        </p>
      )}
      <NotificationList notifications={notifications} canOpenOrders={canViewOrders(user)} />
    </>
  );
}
