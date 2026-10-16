import { requireAdmin } from "@/lib/admin-auth";
import { fetchStoreSettings } from "@/lib/settings.server";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  if (!user.isOwner) {
    return <AccessDenied message="仅店主可以维护店铺设置。" />;
  }

  const settings = await fetchStoreSettings();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">店铺设置</h1>
        <p className="mt-1 text-sm text-slate-600">配置前台展示内容与下单规则</p>
      </div>
      <SettingsForm settings={settings} />
    </>
  );
}
