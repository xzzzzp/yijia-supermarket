import { requireAdmin } from "@/lib/admin-auth";
import { adminRoleLabel } from "@/lib/staff-access";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-2">
        <p className="text-sm text-slate-500">
          已登录：{user.email}（{adminRoleLabel(user)}）
        </p>
      </div>
      <AdminNav user={user} />
      {children}
    </div>
  );
}
