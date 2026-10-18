import { requireAdmin } from "@/lib/admin-auth";
import { countUnreadNotifications } from "@/lib/notifications.server";
import { adminRoleLabel, hasCapability } from "@/lib/staff-access";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const unreadCount = hasCapability(user, "orderNotifications")
    ? await countUnreadNotifications(user.staffId)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-2">
        <p className="text-sm text-slate-500">
          已登录：{user.email}（{adminRoleLabel(user)}）
        </p>
      </div>
      <AdminNav user={user} unreadCount={unreadCount} />
      {children}
    </div>
  );
}
