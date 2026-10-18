"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/category-actions";
import { categoryRemovalMessage, type AdminCategory } from "@/lib/categories";

interface CategoryManagerProps {
  categories: AdminCategory[];
  source: "mysql" | "default";
  warning?: string;
}

interface Draft {
  mode: "create" | "edit";
  slug: string;
  nameZh: string;
  nameRu: string;
  nameUz: string;
  description: string;
  sortOrder: string;
  showOnHome: boolean;
  enabled: boolean;
}

function emptyDraft(): Draft {
  return {
    mode: "create",
    slug: "",
    nameZh: "",
    nameRu: "",
    nameUz: "",
    description: "",
    sortOrder: "0",
    showOnHome: true,
    enabled: true,
  };
}

function draftFrom(category: AdminCategory): Draft {
  return {
    mode: "edit",
    slug: category.slug,
    nameZh: category.nameZh,
    nameRu: category.nameRu,
    nameUz: category.nameUz,
    description: category.description,
    sortOrder: String(category.sortOrder),
    showOnHome: category.showOnHome,
    enabled: category.enabled,
  };
}

export function CategoryManager({ categories, source, warning }: CategoryManagerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);
  const [pending, startTransition] = useTransition();

  const showResult = (result: { ok: boolean; message: string }, reset: boolean) => {
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) {
      if (reset) setDraft(emptyDraft());
      router.refresh();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const current = categories.find((category) => category.slug === draft.slug);
    if (draft.mode === "edit" && current?.enabled && !draft.enabled) {
      const blocked = categoryRemovalMessage(current.productCount, "停用");
      if (blocked) {
        setMessage(blocked);
        setMessageOk(false);
        return;
      }
    }

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result =
        draft.mode === "create" ? await createCategoryAction(formData) : await updateCategoryAction(formData);
      showResult(result, draft.mode === "create");
    });
  };

  const handleDelete = (category: AdminCategory) => {
    const blocked = categoryRemovalMessage(category.productCount, "删除");
    if (blocked) {
      setMessage(blocked);
      setMessageOk(false);
      return;
    }
    if (!confirm(`确定删除分类「${category.nameZh}」(${category.slug}) 吗？`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(category.slug);
      showResult(result, false);
      if (result.ok && draft.slug === category.slug) setDraft(emptyDraft());
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
        <p>这里的分类同时用于首页热门分类和商品表单下拉。关闭「首页显示」后，热门分类不再展示该分类，商品仍可选用。</p>
        <p className="mt-2">关闭「启用」或删除时，如果该分类下还有商品，需要先把商品改到其他分类。</p>
        <p className="mt-2 text-xs text-slate-500">
          数据来源：{source === "mysql" ? "MySQL product_categories 表" : "内置示例分类"}
        </p>
      </div>

      {source !== "mysql" && (
        <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          本地开发模式：当前显示内置分类。配置 MYSQL_* 并执行 mysql/migrations/20261018_product_categories.sql 后才能增删改。
        </p>
      )}

      {warning && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{warning}</p>
      )}

      {message && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            messageOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{draft.mode === "create" ? "新增分类" : `编辑 ${draft.slug}`}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            slug *
            <input
              name="slug"
              value={draft.slug}
              onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase() })}
              readOnly={draft.mode === "edit"}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={64}
              placeholder="例如 fresh-fruit"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 read-only:bg-slate-50"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            排序 *
            <input
              name="sortOrder"
              type="number"
              value={draft.sortOrder}
              onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            中文名称 *
            <input
              name="nameZh"
              value={draft.nameZh}
              onChange={(event) => setDraft({ ...draft, nameZh: event.target.value })}
              required
              maxLength={255}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            俄语名称 *
            <input
              name="nameRu"
              value={draft.nameRu}
              onChange={(event) => setDraft({ ...draft, nameRu: event.target.value })}
              required
              maxLength={255}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            乌兹别克语名称 *
            <input
              name="nameUz"
              value={draft.nameUz}
              onChange={(event) => setDraft({ ...draft, nameUz: event.target.value })}
              required
              maxLength={255}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          描述（可选）
          <textarea
            name="description"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            maxLength={512}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
          />
        </label>
        <div className="flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="hidden" name="showOnHome" value="0" />
            <input
              type="checkbox"
              name="showOnHome"
              value="1"
              checked={draft.showOnHome}
              onChange={(event) => setDraft({ ...draft, showOnHome: event.target.checked })}
              className="size-4 accent-red-600"
            />
            首页显示
          </label>
          <label className="flex items-center gap-2">
            <input type="hidden" name="enabled" value="0" />
            <input
              type="checkbox"
              name="enabled"
              value="1"
              checked={draft.enabled}
              onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
              className="size-4 accent-red-600"
            />
            启用
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "保存中…" : draft.mode === "create" ? "创建分类" : "保存修改"}
          </button>
          {draft.mode === "edit" && (
            <button
              type="button"
              onClick={() => setDraft(emptyDraft())}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              取消编辑
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">排序</th>
                <th className="px-4 py-3 font-semibold">slug</th>
                <th className="px-4 py-3 font-semibold">名称</th>
                <th className="px-4 py-3 font-semibold">商品</th>
                <th className="px-4 py-3 font-semibold">首页</th>
                <th className="px-4 py-3 font-semibold">启用</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.slug} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-4 py-3">{category.sortOrder}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{category.slug}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{category.nameZh}</p>
                    <p className="text-xs text-slate-500">
                      {category.nameRu} / {category.nameUz}
                    </p>
                    {category.description && <p className="text-xs text-slate-400">{category.description}</p>}
                  </td>
                  <td className="px-4 py-3">{category.productCount}</td>
                  <td className="px-4 py-3">{category.showOnHome ? "显示" : "隐藏"}</td>
                  <td className="px-4 py-3">{category.enabled ? "启用" : "停用"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(draftFrom(category));
                          setMessage("");
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDelete(category)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!categories.length && <p className="py-12 text-center text-slate-500">还没有分类</p>}
      </div>
    </div>
  );
}
