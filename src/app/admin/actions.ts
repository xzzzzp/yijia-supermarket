"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { hasCapability } from "@/lib/staff-access";
import { clearAdminSession, setAdminSession } from "@/lib/dev-auth";
import { isMysqlConfigured } from "@/lib/mysql";
import { matchProductByFilename, uploadProductImage } from "@/lib/storage";
import {
  deleteProductRecord,
  fetchAllProducts,
  insertProduct,
  updateProductImage,
  updateProductRecord,
} from "@/lib/products.server";
import { loginStaff } from "@/lib/staff.server";
import { saveStoreSettings } from "@/lib/settings.server";
import { transitionOrderStatus } from "@/lib/orders.server";
import { isOrderStatus } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import { parseStoreSettingsForm } from "@/lib/store-settings-defaults";
import { parseProductForm, validateProductInput } from "@/types/admin";
import type { BatchImportResult } from "@/types/admin";

async function ensureProductWriter(): Promise<{ ok: false; message: string } | null> {
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
  return null;
}

export async function adminLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const result = await loginStaff(email, password);

  if (!result.ok) {
    redirect(`/admin/login?error=${result.error}`);
  }

  try {
    await setAdminSession({ staffId: result.staffId, email: result.email });
  } catch (err) {
    console.error("Failed to set admin session:", err);
    redirect("/admin/login?error=session");
  }
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createProduct(formData: FormData) {
  const denied = await ensureProductWriter();
  if (denied) return denied;
  const input = parseProductForm(formData);
  const error = validateProductInput(input);
  if (error) return { ok: false as const, message: error };

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

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/products/${id}/edit?saved=1`);
}

export async function createProductAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  return createProduct(formData);
}

export async function updateProduct(id: string, formData: FormData) {
  const denied = await ensureProductWriter();
  if (denied) return denied;
  const input = parseProductForm(formData);
  const error = validateProductInput(input);
  if (error) return { ok: false as const, message: error };

  try {
    await updateProductRecord(id, input);
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
    return {
      ok: false as const,
      message: code === "ER_DUP_ENTRY" ? "source_key 已存在" : err instanceof Error ? err.message : "保存失败",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/products/${input.category}`);
  return { ok: true as const, message: "保存成功" };
}

export async function deleteProduct(id: string) {
  const denied = await ensureProductWriter();
  if (denied) return denied;

  try {
    await deleteProductRecord(id);
  } catch (err) {
    return { ok: false as const, message: err instanceof Error ? err.message : "删除失败" };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true as const, message: "已删除" };
}

export async function uploadProductImageAction(formData: FormData) {
  const denied = await ensureProductWriter();
  if (denied) return denied;

  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") ?? "misc");

  if (!file || file.size === 0) {
    return { ok: false as const, message: "请选择图片文件" };
  }

  try {
    const url = await uploadProductImage(file, category);
    return { ok: true as const, url };
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "上传失败",
    };
  }
}

export async function batchImportImages(formData: FormData) {
  const denied = await ensureProductWriter();
  if (denied) return { ...denied, results: [] };

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

  revalidatePath("/");
  revalidatePath("/admin");

  return {
    ok: true as const,
    message: `处理完成：${results.filter((r) => r.status === "matched").length} 成功，${results.filter((r) => r.status === "unmatched").length} 未匹配，${results.filter((r) => r.status === "error").length} 失败`,
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
  revalidatePath("/admin/orders");
  return result;
}
