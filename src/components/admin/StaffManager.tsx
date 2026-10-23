"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaffAction, deleteStaffAction, updateStaffAction } from "@/app/admin/staff-actions";
import { MIN_STAFF_PASSWORD_LENGTH } from "@/lib/password-policy";
import type { StaffRecord, StaffStoreSource } from "@/types/staff";

interface StaffManagerProps {
  staff: StaffRecord[];
  currentStaffId: string | null;
  source: StaffStoreSource;
  warning?: string;
  authMode: "mysql" | "dev" | "none";
}

const CAPABILITIES = [
  { name: "orderNotifications", label: "接单通知" },
  { name: "viewStats", label: "查看收益/统计" },
  { name: "fulfillment", label: "配货" },
  { name: "manageProducts", label: "商品上架" },
] as const;

function CapabilityCheckboxes({
  values,
}: {
  values?: Pick<StaffRecord, "orderNotifications" | "viewStats" | "fulfillment" | "manageProducts">;
}) {
  return (
    <div className="grid gap-2 md:flex md:flex-wrap md:gap-3">
      {CAPABILITIES.map((capability) => (
        <label
          key={capability.name}
          className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 md:min-h-0 md:gap-2 md:rounded-none md:border-0 md:px-0"
        >
          <input type="hidden" name={capability.name} value="0" />
          <input
            type="checkbox"
            name={capability.name}
            value="1"
            defaultChecked={values ? values[capability.name] : false}
            className="size-5 accent-red-600 md:size-4"
          />
          {capability.label}
        </label>
      ))}
    </div>
  );
}

export function StaffManager({
  staff,
  currentStaffId,
  source,
  warning,
  authMode,
}: StaffManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);
  const [pending, startTransition] = useTransition();
  const ownerCount = staff.filter((member) => member.isOwner).length;

  const showResult = (result: { ok: boolean; message: string }) => {
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) router.refresh();
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createStaffAction(formData);
      showResult(result);
      if (result.ok) form.reset();
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      showResult(await updateStaffAction(formData));
    });
  };

  const handleDelete = (member: StaffRecord) => {
    if (!confirm(`确定删除店员「${member.displayName || member.email}」吗？`)) return;
    startTransition(async () => {
      const result = await deleteStaffAction(member.id);
      if (result) showResult(result);
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
        <p>
          店主拥有全部能力。店员按岗位勾选：接单通知、查看收益/统计、配货、商品上架。店铺设置只对店主开放。
        </p>
        <p className="mt-2">
          {authMode === "mysql"
            ? "店员用邮箱和密码登录。添加时要设登录密码。店员表为空时，只有 ADMIN_DEV_EMAIL / ADMIN_DEV_PASSWORD 能创建第一名店主。"
            : "未配置 MySQL。店员写在 data/staff.json，只有开发账号可以登录。"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          数据来源：{source === "mysql" ? "MySQL staff 表" : "本地 data/staff.json"}
        </p>
      </div>

      {warning && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 break-words text-amber-900">
          {warning}
        </p>
      )}

      {message && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm leading-6 break-words ${
            messageOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">添加店员</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm text-slate-700">
            邮箱
            <input
              name="email"
              type="email"
              required
              placeholder="staff@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-red-500"
            />
          </label>
          <label className="block text-sm text-slate-700">
            姓名
            <input
              name="displayName"
              type="text"
              placeholder="可选"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-red-500"
            />
          </label>
          {authMode === "mysql" && (
            <label className="block text-sm text-slate-700 md:col-span-2">
              登录密码
              <input
                name="password"
                type="password"
                required
                minLength={MIN_STAFF_PASSWORD_LENGTH}
                autoComplete="new-password"
                placeholder={`至少 ${MIN_STAFF_PASSWORD_LENGTH} 位`}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-red-500"
              />
            </label>
          )}
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 md:min-h-0 md:gap-2 md:rounded-none md:border-0 md:px-0">
          <input type="hidden" name="isOwner" value="0" />
          <input type="checkbox" name="isOwner" value="1" className="size-5 accent-red-600 md:size-4" />
          设为店主
        </label>
        <CapabilityCheckboxes />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 md:min-h-0 md:w-auto"
        >
          {pending ? "保存中…" : "添加店员"}
        </button>
      </form>

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          还没有店员记录。请退出后用店主邮箱和密码重新登录，写入成功才会成为店主。
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map((member) => {
            const lockedOwner = member.isOwner && ownerCount <= 1;
            const isSelf = member.id === currentStaffId;

            return (
              <form
                key={`${member.id}-${member.updatedAt}`}
                onSubmit={handleUpdate}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <input type="hidden" name="id" value={member.id} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{member.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {isSelf ? "当前登录账号" : "店员"}
                      {member.isOwner ? " · 店主拥有全部能力" : ""}
                    </p>
                  </div>
                  {!isSelf && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(member)}
                      className="min-h-11 w-full rounded-xl border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 md:min-h-0 md:w-auto md:rounded-lg md:text-xs"
                    >
                      删除
                    </button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm text-slate-700">
                    姓名
                    <input
                      name="displayName"
                      type="text"
                      defaultValue={member.displayName}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-red-500"
                    />
                  </label>
                  {authMode === "mysql" && (
                    <label className="block text-sm text-slate-700">
                      新密码
                      <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={MIN_STAFF_PASSWORD_LENGTH}
                        placeholder={`留空则不修改（至少 ${MIN_STAFF_PASSWORD_LENGTH} 位）`}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-red-500"
                      />
                    </label>
                  )}
                </div>

                {lockedOwner ? (
                  <>
                    <input type="hidden" name="isOwner" value="1" />
                    <p className="text-sm text-slate-600">店主（至少保留一名，不能取消）</p>
                  </>
                ) : (
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 md:min-h-0 md:gap-2 md:rounded-none md:border-0 md:px-0">
                    <input type="hidden" name="isOwner" value="0" />
                    <input
                      type="checkbox"
                      name="isOwner"
                      value="1"
                      defaultChecked={member.isOwner}
                      className="size-5 accent-red-600 md:size-4"
                    />
                    店主
                  </label>
                )}

                <CapabilityCheckboxes values={member} />

                <button
                  type="submit"
                  disabled={pending}
                  className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 md:min-h-0 md:w-auto"
                >
                  {pending ? "保存中…" : "保存权限"}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
