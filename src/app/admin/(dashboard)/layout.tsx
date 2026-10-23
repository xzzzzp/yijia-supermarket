import { requireAdmin } from "@/lib/admin-auth";
import { getInAppNotificationHint } from "@/lib/notifications.server";
import { adminRoleLabel, hasCapability } from "@/lib/staff-access";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const liveHint =
    hasCapability(user, "orderNotifications") && user.staffId
      ? await getInAppNotificationHint(user.staffId)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-2">
        <p className="text-sm break-words text-slate-500">
          已登录：{user.email}（{adminRoleLabel(user)}）
        </p>
      </div>
      <AdminNav
        user={user}
        unreadCount={liveHint?.unreadCount ?? 0}
        newestNotificationId={liveHint?.newestNotificationId ?? null}
      />
      {children}
    </div>
  );
}
