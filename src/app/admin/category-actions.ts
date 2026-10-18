"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { recordAudit } from "@/lib/audit.server";
import { parseCategoryForm, validateCategoryInput, type CategoryInput } from "@/lib/categories";
import {
  categorySchemaHint,
  deleteCategoryRecord,
  getCategoryBySlug,
  insertCategory,
  listCategories,
  updateCategoryRecord,
} from "@/lib/categories.server";
import { isMysqlConfigured } from "@/lib/mysql";
import { hasCapability } from "@/lib/staff-access";
import type { AuditAction } from "@/types/audit";
import type { AdminSession } from "@/types/staff";

function writeAudit(
  user: Pick<AdminSession, "email" | "staffId">,
  input: { action: AuditAction; targetId?: string | null; summary: string },
) {
  return recordAudit({
    actorEmail: user.email,
    actorStaffId: user.staffId,
    action: input.action,
    targetType: "category",
    targetId: input.targetId,
    summary: input.summary,
  });
}

async function requireProductManager() {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return { user: null, error: { ok: false as const, message: "没有商品上架权限" } };
  }
  if (!isMysqlConfigured()) {
    return {
      user: null,
      error: {
        ok: false as const,
        message: "当前为本地开发模式，分类是内置示例。配置 MYSQL_* 并执行分类迁移后才能增删改分类。",
      },
    };
  }
  const directory = await listCategories();
  if (directory.source !== "mysql") {
    return {
      user: null,
      error: { ok: false as const, message: directory.warning ?? categorySchemaHint() },
    };
  }
  return { user, error: null };
}

function revalidateCategorySurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
  revalidatePath("/admin/import");
  if (slug) revalidatePath(`/products/${slug}`);
}

function mysqlErrorMessage(err: unknown, fallback: string): string {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
  if (code === "ER_DUP_ENTRY") return "slug 已存在";
  if (code === "ER_NO_SUCH_TABLE") return categorySchemaHint();
  return err instanceof Error ? err.message : fallback;
}

function switchLabel(before: boolean, after: boolean, label: string): string | null {
  if (before === after) return null;
  return `${label} ${before ? "开" : "关"}→${after ? "开" : "关"}`;
}

function updateSummary(before: { nameZh: string; showOnHome: boolean; enabled: boolean }, input: CategoryInput): string {
  const changes = [
    switchLabel(before.showOnHome, input.showOnHome, "首页显示"),
    switchLabel(before.enabled, input.enabled, "启用"),
  ].filter((item): item is string => Boolean(item));
  const base = `更新分类「${input.nameZh}」(${input.slug})`;
  return changes.length ? `${base}：${changes.join("，")}` : base;
}

export async function createCategoryAction(formData: FormData) {
  const { user, error } = await requireProductManager();
  if (error || !user) return error ?? { ok: false as const, message: "没有商品上架权限" };

  const input = parseCategoryForm(formData);
  const invalid = validateCategoryInput(input);
  if (invalid) return { ok: false as const, message: invalid };

  try {
    await insertCategory(input);
  } catch (err) {
    return { ok: false as const, message: mysqlErrorMessage(err, "创建失败") };
  }

  await writeAudit(user, {
    action: "category.create",
    targetId: input.slug,
    summary: `新增分类「${input.nameZh}」(${input.slug})`,
  });
  revalidateCategorySurfaces(input.slug);
  return { ok: true as const, message: "分类已创建" };
}

export async function updateCategoryAction(formData: FormData) {
  const { user, error } = await requireProductManager();
  if (error || !user) return error ?? { ok: false as const, message: "没有商品上架权限" };

  const input = parseCategoryForm(formData);
  const invalid = validateCategoryInput(input);
  if (invalid) return { ok: false as const, message: invalid };

  const before = await getCategoryBySlug(input.slug);
  if (!before) return { ok: false as const, message: "未找到该分类" };

  try {
    await updateCategoryRecord(input);
  } catch (err) {
    return { ok: false as const, message: mysqlErrorMessage(err, "保存失败") };
  }

  await writeAudit(user, {
    action: "category.update",
    targetId: input.slug,
    summary: updateSummary(before, input),
  });
  revalidateCategorySurfaces(input.slug);
  return { ok: true as const, message: "分类已保存" };
}

export async function deleteCategoryAction(slug: string) {
  const { user, error } = await requireProductManager();
  if (error || !user) return error ?? { ok: false as const, message: "没有商品上架权限" };

  const existing = await getCategoryBySlug(slug);
  if (!existing) return { ok: false as const, message: "未找到该分类" };

  try {
    await deleteCategoryRecord(slug);
  } catch (err) {
    return { ok: false as const, message: mysqlErrorMessage(err, "删除失败") };
  }

  await writeAudit(user, {
    action: "category.delete",
    targetId: slug,
    summary: `删除分类「${existing.nameZh}」(${slug})`,
  });
  revalidateCategorySurfaces(slug);
  return { ok: true as const, message: "分类已删除" };
}
