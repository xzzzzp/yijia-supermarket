import { fetchStoreSettings } from "@/lib/settings.server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
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
