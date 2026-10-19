"use client";

import { useActionState, useRef, useState } from "react";
import { categoriesForProductForm } from "@/lib/categories";
import type { CategoryInfo, Product } from "@/types/product";
import {
  createProductAction,
  updateProduct,
  uploadProductImageAction,
} from "@/app/admin/actions";
import { PLACEHOLDER_IMAGE } from "@/lib/assets";
import { ProductImage } from "@/components/ProductImage";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
  categories: CategoryInfo[];
}

const defaultValues = {
  sourceKey: "",
  name: "",
  nameRu: "",
  nameUz: "",
  spec: "",
  specRu: "",
  specUz: "",
  image: PLACEHOLDER_IMAGE,
  price: 0,
  sortOrder: 0,
  category: "drinks",
  inStock: true,
  isNew: false,
  isPublished: true,
};

type ActionState = { ok: boolean; message: string } | null;

export function ProductForm({ product, mode, categories }: ProductFormProps) {
  const selectable = categoriesForProductForm(categories);
  const currentMissing = Boolean(product && !selectable.some((category) => category.slug === product.category));
  const [image, setImage] = useState(product?.image ?? defaultValues.image);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const boundUpdate = product
    ? updateProduct.bind(null, product.id)
    : null;

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      formData.set("image", image);
      if (mode === "create") {
        return createProductAction(_prev, formData);
      }
      if (boundUpdate) {
        return boundUpdate(formData);
      }
      return { ok: false, message: "无效操作" };
    },
    null,
  );

  const values = product ?? defaultValues;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "category",
      (document.getElementById("category") as HTMLSelectElement)?.value || "misc",
    );

    const result = await uploadProductImageAction(formData);
    setUploading(false);

    if (result.ok && result.url) {
      setImage(result.url);
      setUploadMsg("图片上传成功");
    } else if (!result.ok) {
      setUploadMsg(result.message || "上传失败");
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">商品图片</p>
          <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-xl bg-slate-50">
            <ProductImage
              image={image}
              alt="preview"
              className="object-contain p-2"
              sizes="180px"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? "上传中…" : "上传图片"}
          </button>
          {uploadMsg && (
            <p className="mt-2 text-center text-xs text-slate-500">{uploadMsg}</p>
          )}
          <input type="hidden" name="image" value={image} readOnly />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="source_key *" name="sourceKey" defaultValue={values.sourceKey} />
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                分类 *
              </label>
              <select
                id="category"
                name="category"
                defaultValue={currentMissing ? "" : (product?.category ?? selectable[0]?.slug ?? "")}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
                required
              >
                {currentMissing && <option value="">请改选启用中的分类</option>}
                {selectable.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nameZh} ({c.slug})
                  </option>
                ))}
              </select>
              {currentMissing && (
                <p className="mt-1 text-xs text-amber-700">
                  当前分类「{product?.categoryName || product?.category}」已停用或不存在，请先改到其他分类再保存。
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="中文名称 *" name="name" defaultValue={values.name} />
            <Field label="俄语名称" name="nameRu" defaultValue={values.nameRu} />
            <Field label="乌兹别克语名称" name="nameUz" defaultValue={values.nameUz} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="中文规格" name="spec" defaultValue={values.spec} />
            <Field label="俄语规格" name="specRu" defaultValue={values.specRu} />
            <Field label="乌兹别克语规格" name="specUz" defaultValue={values.specUz} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="价格 (UZS) *"
              name="price"
              type="number"
              defaultValue={String(values.price)}
            />
            <Field
              label="排序"
              name="sortOrder"
              type="number"
              defaultValue={String(values.sortOrder)}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <Checkbox label="有货" name="inStock" defaultChecked={values.inStock} />
            <Checkbox label="新品" name="isNew" defaultChecked={values.isNew} />
            <Checkbox label="已上架" name="isPublished" defaultChecked={values.isPublished} />
          </div>
        </div>
      </div>

      {state && !state.ok && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
      )}
      {state?.ok && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "保存中…" : mode === "create" ? "创建商品" : "保存修改"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={label.includes("*")}
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
      />
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-red-600"
      />
      {label}
    </label>
  );
}
