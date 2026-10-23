"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { clientAddress } from "@/lib/client-ip";
import {
  loginLockRemaining,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/login-rate-limit";
import { recordAudit } from "@/lib/audit.server";
import { hasCapability } from "@/lib/staff-access";
import { clearAdminSession, setAdminSession } from "@/lib/dev-auth";
import { isMysqlConfigured } from "@/lib/mysql";
import { PLACEHOLDER_IMAGE } from "@/lib/assets";
import { fileImageKey, nameSpecImageKey, parseProductSheet, planProductImport } from "@/lib/excel-products";
import { readSpreadsheet } from "@/lib/excel-workbook";
import { matchProductByFilename, uploadProductImage } from "@/lib/storage";
import {
  deleteProductRecord,
  fetchAllProducts,
  fetchProductById,
  insertProduct,
  updateImportedProduct,
  updateProductImage,
  updateProductRecommendationRecord,
  updateProductRecord,
} from "@/lib/products.server";
import { loginStaff } from "@/lib/staff.server";
import { saveStoreSettings } from "@/lib/settings.server";
import { transitionOrderStatus } from "@/lib/orders.server";
import { isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import type { AdminSession } from "@/types/staff";
import { parseStoreSettingsForm } from "@/lib/store-settings-defaults";
import { categoryAssignmentMessage } from "@/lib/categories";
import { getCategoryBySlug, listCategories } from "@/lib/categories.server";
import { parseProductForm, recommendSortError, validateProductInput } from "@/types/admin";
import type { BatchImportResult, ExcelImportRowResult } from "@/types/admin";
import type { AuditAction } from "@/types/audit";

async function ensureProductWriter(): Promise<
  { ok: false; message: string } | { ok: true; user: AdminSession }
> {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return { ok: false as const, message: "没有商品上架权限" };
  }
  if (!isMysqlConfigured()) {
    return {
      ok: false as const,
      message: "当前为本地开发模式，商品数据为示例数据。配置 MYSQL_* 后才能增删改商品。",
    };
  }
  return { ok: true, user };
}

function revalidateProductPages(category?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/products/new");
  if (category) revalidatePath(`/products/${category}`);
}

function writeAudit(
  user: Pick<AdminSession, "email" | "staffId">,
  input: { action: AuditAction; targetType: string; targetId?: string | null; summary: string },
) {
  return recordAudit({
    actorEmail: user.email,
    actorStaffId: user.staffId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary,
  });
}

async function loginClientKey(): Promise<string> {
  try {
    const headerList = await headers();
    return clientAddress(headerList.get("x-forwarded-for"), headerList.get("x-real-ip")) || "unknown";
  } catch {
    return "unknown";
  }
}

export async function adminLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const attempted = email.toLowerCase() || "（未填写）";
  const ip = await loginClientKey();

  if (loginLockRemaining(ip) > 0) {
    await writeAudit(
      { email: attempted, staffId: null },
      {
        action: "login.failed",
        targetType: "staff",
        targetId: null,
        summary: `登录失败（${attempted}）：尝试过于频繁`,
      },
    );
    redirect("/admin/login?error=rate");
  }

  const result = await loginStaff(email, password);

  if (!result.ok) {
    const locked = result.error === "invalid" && recordLoginFailure(ip).locked;
    const reason = locked
      ? "尝试过于频繁"
      : result.error === "db"
        ? "无法读取店员表"
        : result.error === "session"
          ? "无法签发会话"
          : "邮箱或密码不正确";
    await writeAudit(
      { email: attempted, staffId: null },
      {
        action: "login.failed",
        targetType: "staff",
        targetId: null,
        summary: `登录失败（${attempted}）：${reason}`,
      },
    );
    redirect(`/admin/login?error=${locked ? "rate" : result.error}`);
  }

  recordLoginSuccess(ip);

  try {
    await setAdminSession({ staffId: result.staffId, email: result.email });
  } catch (err) {
    console.error("Failed to set admin session:", err);
    await writeAudit(
      { email: result.email, staffId: result.staffId },
      {
        action: "login.failed",
        targetType: "staff",
        targetId: result.staffId,
        summary: `登录失败（${result.email}）：无法签发会话`,
      },
    );
    redirect("/admin/login?error=session");
  }

  await writeAudit(
    { email: result.email, staffId: result.staffId },
    {
      action: "login",
      targetType: "staff",
      targetId: result.staffId,
      summary: `登录后台（${result.email}）`,
    },
  );
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createProduct(formData: FormData) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return gate;
  const input = parseProductForm(formData);
  const error = validateProductInput(input);
  if (error) return { ok: false as const, message: error };
  const categoryError = categoryAssignmentMessage(await getCategoryBySlug(input.category));
  if (categoryError) return { ok: false as const, message: categoryError };

  let id: string;
  try {
    id = await insertProduct(input);
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
    return {
      ok: false as const,
      message: code === "ER_DUP_ENTRY" ? "source_key 已存在" : err instanceof Error ? err.message : "创建失败",
    };
  }

  await writeAudit(gate.user, {
    action: "product.create",
    targetType: "product",
    targetId: id,
    summary: `新增商品「${input.name}」`,
  });

  revalidateProductPages(input.category);
  redirect(`/admin/products/${id}/edit?saved=1`);
}

export async function createProductAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  return createProduct(formData);
}

export async function updateProduct(id: string, formData: FormData) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return gate;
  const input = parseProductForm(formData);
  const error = validateProductInput(input);
  if (error) return { ok: false as const, message: error };
  const categoryError = categoryAssignmentMessage(await getCategoryBySlug(input.category));
  if (categoryError) return { ok: false as const, message: categoryError };

  try {
    await updateProductRecord(id, input);
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
    return {
      ok: false as const,
      message: code === "ER_DUP_ENTRY" ? "source_key 已存在" : err instanceof Error ? err.message : "保存失败",
    };
  }

  await writeAudit(gate.user, {
    action: "product.update",
    targetType: "product",
    targetId: id,
    summary: `更新商品「${input.name}」`,
  });

  revalidateProductPages(input.category);
  return { ok: true as const, message: "保存成功" };
}

export async function updateProductRecommendation(id: string, isNew: boolean, recommendSort: number) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return gate;
  if (typeof isNew !== "boolean") {
    return { ok: false as const, message: "新品推荐参数无效" };
  }
  const sortError = recommendSortError(recommendSort);
  if (sortError) return { ok: false as const, message: sortError };

  const existing = await fetchProductById(id);
  if (!existing) return { ok: false as const, message: "未找到该商品" };

  try {
    await updateProductRecommendationRecord(id, { isNew, recommendSort });
  } catch (err) {
    return { ok: false as const, message: err instanceof Error ? err.message : "保存失败" };
  }

  await writeAudit(gate.user, {
    action: "product.update",
    targetType: "product",
    targetId: id,
    summary: `更新新品推荐「${existing.name}」：${isNew ? "推荐" : "取消推荐"}，排序 ${recommendSort}`,
  });

  revalidateProductPages(existing.category);
  return { ok: true as const, message: "已更新新品推荐" };
}

export async function deleteProduct(id: string) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return gate;

  const existing = await fetchProductById(id);

  try {
    await deleteProductRecord(id);
  } catch (err) {
    return { ok: false as const, message: err instanceof Error ? err.message : "删除失败" };
  }

  await writeAudit(gate.user, {
    action: "product.delete",
    targetType: "product",
    targetId: id,
    summary: existing ? `删除商品「${existing.name}」` : `删除商品 ${id}`,
  });

  revalidateProductPages(existing?.category);
  return { ok: true as const, message: "已删除" };
}

export async function uploadProductImageAction(formData: FormData) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return gate;

  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") ?? "misc");

  if (!file || file.size === 0) {
    return { ok: false as const, message: "请选择图片文件" };
  }

  try {
    const url = await uploadProductImage(file, category);
    await writeAudit(gate.user, {
      action: "product.image",
      targetType: "product",
      targetId: null,
      summary: `上传商品图片 ${file.name || url}`,
    });
    return { ok: true as const, url };
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "上传失败",
    };
  }
}

export async function batchImportImages(formData: FormData) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return { ...gate, results: [] };

  const category = String(formData.get("category") ?? "");
  const autoMatch = formData.get("autoMatch") === "on";
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return { ok: false as const, message: "请选择至少一张图片", results: [] };
  }

  const products = await fetchAllProducts();
  const results: BatchImportResult[] = [];

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const cat = category || "misc";

    try {
      const imageUrl = await uploadProductImage(file, cat);

      if (autoMatch) {
        const matched = matchProductByFilename(file.name, products);
        if (matched) {
          await updateProductImage(matched.id, imageUrl);

          results.push({
            filename: file.name,
            status: "matched",
            productName: matched.name,
            imageUrl,
          });
        } else {
          results.push({
            filename: file.name,
            status: "unmatched",
            imageUrl,
            message: "未找到匹配商品，图片已上传",
          });
        }
      } else {
        results.push({
          filename: file.name,
          status: "matched",
          imageUrl,
          message: "已上传（未自动匹配）",
        });
      }
    } catch (err) {
      results.push({
        filename: file.name,
        status: "error",
        message: err instanceof Error ? err.message : "上传失败",
      });
    }
  }

  revalidateProductPages();

  const matched = results.filter((item) => item.status === "matched").length;
  const unmatched = results.filter((item) => item.status === "unmatched").length;
  const failed = results.filter((item) => item.status === "error").length;

  await writeAudit(gate.user, {
    action: "product.import",
    targetType: "product",
    targetId: category || null,
    summary: `批量导入图片：${matched} 成功，${unmatched} 未匹配，${failed} 失败`,
  });

  return {
    ok: true as const,
    message: `处理完成：${matched} 成功，${unmatched} 未匹配，${failed} 失败`,
    results,
  };
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]);

export async function importProductsFromExcel(formData: FormData) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return { ...gate, rows: [] as ExcelImportRowResult[] };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, message: "请选择 Excel 或 CSV 文件", rows: [] as ExcelImportRowResult[] };
  }

  const spreadsheet = readSpreadsheet(new Uint8Array(await file.arrayBuffer()), file.name);
  if ("error" in spreadsheet) {
    return { ok: false as const, message: spreadsheet.error, rows: [] as ExcelImportRowResult[] };
  }

  const parsed = parseProductSheet(spreadsheet.rows);
  if (parsed.error) {
    return { ok: false as const, message: parsed.error, rows: [] as ExcelImportRowResult[] };
  }

  const [products, directory] = await Promise.all([fetchAllProducts(), listCategories()]);
  const plans = planProductImport(
    parsed.rows,
    products.map((product) => ({
      id: product.id,
      name: product.name,
      spec: product.spec,
      category: product.category,
      inStock: product.inStock,
      createdAt: product.createdAt,
    })),
    directory.categories.map((category) => ({
      slug: category.slug,
      nameZh: category.nameZh,
      nameRu: category.nameRu,
      nameUz: category.nameUz,
      enabled: category.enabled,
    })),
  );

  const createdIds = new Map<number, string>();
  const rows: ExcelImportRowResult[] = [];

  for (const plan of plans) {
    if (plan.kind === "fail") {
      rows.push({ rowNumber: plan.rowNumber, name: plan.name, spec: plan.spec, status: "failed", message: plan.message });
      continue;
    }

    try {
      if (plan.kind === "create") {
        const id = await insertProduct({
          sourceKey: `excel-${randomUUID().replace(/-/g, "")}`,
          name: plan.name,
          nameRu: "",
          nameUz: "",
          spec: plan.spec,
          specRu: "",
          specUz: "",
          image: PLACEHOLDER_IMAGE,
          price: plan.price,
          inStock: plan.inStock,
          isNew: false,
          recommendSort: 0,
          isPublished: true,
          sortOrder: 0,
          category: plan.category,
        });
        createdIds.set(plan.rowNumber, id);
        rows.push({
          rowNumber: plan.rowNumber,
          name: plan.name,
          spec: plan.spec,
          status: "created",
          message: "已新建",
        });
        continue;
      }

      const productId = plan.productId.startsWith("pending:")
        ? createdIds.get(Number(plan.productId.slice("pending:".length)))
        : plan.productId;
      if (!productId) {
        rows.push({
          rowNumber: plan.rowNumber,
          name: plan.name,
          spec: plan.spec,
          status: "failed",
          message: "找不到刚才新建的商品",
        });
        continue;
      }

      await updateImportedProduct(productId, {
        price: plan.price,
        category: plan.category,
        inStock: plan.inStock,
      });
      rows.push({
        rowNumber: plan.rowNumber,
        name: plan.name,
        spec: plan.spec,
        status: "updated",
        message: plan.warning ?? "已更新单价" + (plan.category ? "、分类" : "") + (plan.inStock != null ? "、库存" : ""),
      });
    } catch (err) {
      rows.push({
        rowNumber: plan.rowNumber,
        name: plan.name,
        spec: plan.spec,
        status: "failed",
        message: err instanceof Error ? err.message : "写入失败",
      });
    }
  }

  const created = rows.filter((row) => row.status === "created").length;
  const updated = rows.filter((row) => row.status === "updated").length;
  const failed = rows.filter((row) => row.status === "failed").length;

  await writeAudit(gate.user, {
    action: "product.import",
    targetType: "product",
    targetId: null,
    summary: `Excel 导入商品：新建 ${created}，更新 ${updated}，失败 ${failed}`,
  });
  revalidateProductPages();

  return {
    ok: true as const,
    message: `处理完成：新建 ${created}，更新 ${updated}，失败 ${failed}`,
    rows,
  };
}

export async function importImagesByNameSpec(formData: FormData) {
  const gate = await ensureProductWriter();
  if (!gate.ok) return { ...gate, results: [] as BatchImportResult[] };

  const files = formData
    .getAll("files")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (!files.length) {
    return { ok: false as const, message: "请选择至少一张图片", results: [] as BatchImportResult[] };
  }

  const products = await fetchAllProducts();
  const results: BatchImportResult[] = [];

  for (const file of files) {
    const matches = products.filter((product) => nameSpecImageKey(product.name, product.spec) === fileImageKey(file.name));
    if (!matches.length) {
      results.push({
        filename: file.name,
        status: "unmatched",
        message: "没有名称+规格与文件名一致的商品，未写入",
      });
      continue;
    }

    const extension = (file.name.match(/\.[A-Za-z0-9]+$/)?.[0] ?? "").toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) {
      results.push({
        filename: file.name,
        status: "error",
        message: "只支持 jpg、png、gif、webp、avif、svg",
      });
      continue;
    }

    try {
      // 中文文件名会被现有上传函数洗成横线，这里改成 ASCII 再交给它。存取路径仍是 /products/<分类>/<文件名>。
      const renamed = new File([await file.arrayBuffer()], `import-${randomUUID()}${extension}`, {
        type: file.type || "application/octet-stream",
      });
      const imageUrl = await uploadProductImage(renamed, matches[0]?.category || "misc");
      for (const product of matches) {
        await updateProductImage(product.id, imageUrl);
      }
      results.push({
        filename: file.name,
        status: "matched",
        productName: matches.map((product) => `${product.name}${product.spec}`).join("、"),
        imageUrl,
        message: matches.length > 1 ? `已设为 ${matches.length} 个同名同规格商品的主图` : "已设为主图",
      });
    } catch (err) {
      results.push({
        filename: file.name,
        status: "error",
        message: err instanceof Error ? err.message : "上传失败",
      });
    }
  }

  revalidateProductPages();

  const matched = results.filter((item) => item.status === "matched").length;
  const unmatched = results.filter((item) => item.status === "unmatched").length;
  const failed = results.filter((item) => item.status === "error").length;
  await writeAudit(gate.user, {
    action: "product.import",
    targetType: "product",
    targetId: null,
    summary: `按名称+规格导入主图：${matched} 成功，${unmatched} 未匹配，${failed} 失败`,
  });

  return {
    ok: true as const,
    message: `处理完成：${matched} 已设为主图，${unmatched} 未匹配，${failed} 失败。未匹配的图片没有写入。`,
    results,
  };
}

export async function updateStoreSettings(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const user = await requireAdmin();
  if (!user.isOwner) {
    return { ok: false as const, message: "仅店主可以修改店铺设置" };
  }

  try {
    await saveStoreSettings(parseStoreSettingsForm(formData));
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "保存失败",
    };
  }

  await writeAudit(user, {
    action: "settings.save",
    targetType: "store_settings",
    targetId: "default",
    summary: "保存店铺设置",
  });

  revalidatePath("/admin/settings");

  return { ok: true as const, message: "保存成功" };
}

export async function transitionOrderStatusAction(orderId: string, status: OrderStatus) {
  const user = await requireAdmin();
  if (!hasCapability(user, "fulfillment")) {
    return { ok: false, message: "没有配货权限，不能修改订单状态" };
  }
  if (!isOrderStatus(status)) {
    return { ok: false, message: "无效的订单状态" };
  }

  const result = await transitionOrderStatus(orderId, status);
  if (result.ok && result.fromStatus) {
    const enteredCompleted = status === "completed";
    const leftCompleted = result.fromStatus === "completed";
    const extra = enteredCompleted ? "，已写入回款时间" : leftCompleted ? "，已清除回款时间" : "";
    await writeAudit(user, {
      action: "order.status",
      targetType: "order",
      targetId: orderId,
      summary: `订单状态：${ORDER_STATUS_LABELS[result.fromStatus]} → ${ORDER_STATUS_LABELS[status]}${extra}`,
    });
  }
  revalidatePath("/admin/orders");
  return result;
}
