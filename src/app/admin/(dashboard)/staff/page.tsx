import { getAdminAuthMode, requireAdmin } from "@/lib/admin-auth";
import { loadStaffDirectory } from "@/lib/staff.server";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { StaffManager } from "@/components/admin/StaffManager";

export default async function AdminStaffPage() {
  const user = await requireAdmin();
  if (!user.isOwner) {
    return <AccessDenied message="仅店主可以配置店员权限。" />;
  }

  const directory = await loadStaffDirectory();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">店员权限</h1>
        <p className="mt-1 text-sm text-slate-600">为店员打开或收回接单通知、查看统计、配货和商品上架。</p>
      </div>
      <StaffManager
        staff={directory.staff}
        currentStaffId={user.staffId}
        source={directory.source}
        warning={directory.warning}
        authMode={getAdminAuthMode()}
      />
    </>
  );
}
