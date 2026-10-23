"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStoreSettings } from "@/app/admin/actions";
import type { LocalizedText, StoreSettings } from "@/types/settings";

interface SettingsFormProps {
  settings: StoreSettings;
}

type ActionState = { ok: boolean; message: string } | null;
function LocalizedFields({
  prefix,
  label,
  values,
  multiline = false,
}: {
  prefix: string;
  label: string;
  values: LocalizedText;
  multiline?: boolean;
}) {
  const fields = [
    { key: "Zh", lang: "中文", value: values.zh },
    { key: "Ru", lang: "俄语", value: values.ru },
    { key: "Uz", lang: "乌兹别克语", value: values.uz },
  ] as const;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {fields.map(({ key, lang, value }) => (
        <div key={key}>
          <label htmlFor={`${prefix}${key}`} className="mb-1 block text-xs text-slate-500">
            {lang}
          </label>
          {multiline ? (
            <textarea
              id={`${prefix}${key}`}
              name={`${prefix}${key}`}
              rows={3}
              defaultValue={value}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          ) : (
            <input
              id={`${prefix}${key}`}
              name={`${prefix}${key}`}
              type="text"
              defaultValue={value}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateStoreSettings,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);
  return (
    <form action={action} className="max-w-3xl space-y-6">
      <Section title="订单设置" description="控制购物车最低下单金额。">
        <div>
          <label htmlFor="minOrderAmount" className="block text-sm font-semibold text-slate-800">
            最低起送金额（som）
          </label>
          <input
            id="minOrderAmount"
            name="minOrderAmount"
            type="number"
            min={0}
            step={1000}
            defaultValue={settings.minOrderAmount}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
          />
        </div>
      </Section>

      <Section title="首页顶部文字" description="首页红色横幅下方的介绍文字，按语言分别显示。">
        <LocalizedFields
          prefix="siteTagline"
          label="首页标语"
          values={settings.siteTagline}
          multiline
        />
      </Section>

      <Section title="营业时间" description="显示在前台营业时间区块；开始/结束小时用于判断「营业中/已打烊」。">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="businessHoursOpen" className="block text-sm font-semibold text-slate-800">
              开始营业（小时 0–23）
            </label>
            <input
              id="businessHoursOpen"
              name="businessHoursOpen"
              type="number"
              min={0}
              max={23}
              defaultValue={settings.businessHoursOpen}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="businessHoursClose" className="block text-sm font-semibold text-slate-800">
              结束营业（小时 0–23，可跨天）
            </label>
            <input
              id="businessHoursClose"
              name="businessHoursClose"
              type="number"
              min={0}
              max={23}
              defaultValue={settings.businessHoursClose}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
        </div>
        <LocalizedFields
          prefix="businessHoursText"
          label="营业时间展示文字"
          values={settings.businessHoursText}
        />
      </Section>

      <Section title="联系我们" description="首页「联系我们」区块的说明与联系方式。">
        <LocalizedFields
          prefix="contactDesc"
          label="联系说明"
          values={settings.contactDesc}
          multiline
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-800">
              电话（tel 链接）
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              defaultValue={settings.phone}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="phoneDisplay" className="block text-sm font-semibold text-slate-800">
              电话展示文字
            </label>
            <input
              id="phoneDisplay"
              name="phoneDisplay"
              type="text"
              defaultValue={settings.phoneDisplay}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="telegram" className="block text-sm font-semibold text-slate-800">
              Telegram 用户名
            </label>
            <input
              id="telegram"
              name="telegram"
              type="text"
              defaultValue={settings.telegram}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="wechat" className="block text-sm font-semibold text-slate-800">
              微信号
            </label>
            <input
              id="wechat"
              name="wechat"
              type="text"
              defaultValue={settings.wechat}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-semibold text-slate-800">
              WhatsApp 号码（不含 +）
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="text"
              defaultValue={settings.whatsapp}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
            />
          </div>
        </div>
      </Section>

      <Section title="如何找到我们" description="首页「如何找到我们」区块的店铺名称与地址。">
        <div>
          <label htmlFor="storeName" className="block text-sm font-semibold text-slate-800">
            店铺名称
          </label>
          <input
            id="storeName"
            name="storeName"
            type="text"
            defaultValue={settings.storeName}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-slate-800">
            地址
          </label>
          <input
            id="address"
            name="address"
            type="text"
            defaultValue={settings.address}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
          />
        </div>
      </Section>

      {state?.message && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-700" : "text-red-600"}`}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 md:min-h-0 md:w-auto"
      >
        {pending ? "保存中…" : "保存设置"}
      </button>
    </form>
  );
}
