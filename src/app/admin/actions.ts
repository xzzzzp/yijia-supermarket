"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { hasCapability } from "@/lib/staff-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  clearDevAdminSession,
  setDevAdminSession,
  verifyDevCredentials,
} from "@/lib/dev-auth";
import { matchProductByFilename, uploadProductImage } from "@/lib/storage";
import { fetchAllProducts } from "@/lib/products.server";
import { saveStoreSettings } from "@/lib/settings.server";
import { transitionOrderStatus } from "@/lib/orders.server";
import { isOrderStatus } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import { parseStoreSettingsForm } from "@/lib/store-settings-defaults";
import {
  parseProductForm,
  productToRow,
  validateProductInput,
} from "@/types/admin";
import type { BatchImportResult } from "@/types/admin";

async function ensureProductWriter(): Promise<{ ok: false; message: string } | null> {
  const user = await requireAdmin();
  if (!hasCapability(user, "manageProducts")) {
    return { ok: false as const, message: "没有商品上架权限" };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false as const,
      message: "当前为本地开发模式，商品数据为示例数据。配置 Supabase 后才能增删改商品。",
    };
  }
  return null;
}

export async function devLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!verifyDevCredentials(email, password)) {
    redirect("/admin/login?error=invalid");
  }

  await setDevAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearDevAdminSession();
  redirect("/admin/login");
}

export async function createProduct(formData: FormData) {
  const denied = await ensureProductWriter();
  if (denied) return denied;
  const input = parseProductForm(formData);
  const error = validateProductInput(input);
  if (error) return { ok: false as const, message: error };

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("products")
    .insert(productToRow(input))
    .select("id")
    .single();

  if (dbError) {
    return { ok: false as const, message: dbError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/products/${data.id}/edit?saved=1`);
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

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("products")
    .update(productToRow(input))
    .eq("id", id);

  if (dbError) {
    return { ok: false as const, message: dbError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/products/${input.category}`);
  return { ok: true as const, message: "保存成功" };
}

export async function deleteProduct(id: string) {
  const denied = await ensureProductWriter();
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);

  if (error) {
    return { ok: false as const, message: error.message };
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
  const admin = createAdminClient();
  const results: BatchImportResult[] = [];

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const cat = category || "misc";

    try {
      const imageUrl = await uploadProductImage(file, cat);

      if (autoMatch) {
        const matched = matchProductByFilename(file.name, products);
        if (matched) {
          const { error } = await admin
            .from("products")
            .update({ image: imageUrl })
            .eq("id", matched.id);

          if (error) throw new Error(error.message);

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
