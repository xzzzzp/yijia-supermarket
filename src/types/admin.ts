import type { ProductCategory } from "@/types/product";

export interface ProductInput {
  sourceKey: string;
  name: string;
  nameRu: string;
  nameUz: string;
  spec: string;
  specRu: string;
  specUz: string;
  image: string;
  price: number;
  inStock: boolean;
  isNew: boolean;
  isPublished: boolean;
  sortOrder: number;
  category: ProductCategory;
}

export function productToRow(input: ProductInput) {
  return {
    source_key: input.sourceKey,
    name: input.name,
    name_ru: input.nameRu,
    name_uz: input.nameUz,
    spec: input.spec,
    spec_ru: input.specRu,
    spec_uz: input.specUz,
    image: input.image || "/products/placeholder.png",
    price: input.price,
    in_stock: input.inStock,
    is_new: input.isNew,
    is_published: input.isPublished,
    sort_order: input.sortOrder,
    category: input.category,
  };
}

export function parseProductForm(formData: FormData): ProductInput {
  return {
    sourceKey: String(formData.get("sourceKey") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    nameRu: String(formData.get("nameRu") ?? "").trim(),
    nameUz: String(formData.get("nameUz") ?? "").trim(),
    spec: String(formData.get("spec") ?? "").trim(),
    specRu: String(formData.get("specRu") ?? "").trim(),
    specUz: String(formData.get("specUz") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
    price: Number(formData.get("price") ?? 0),
    inStock: formData.get("inStock") === "on",
    isNew: formData.get("isNew") === "on",
    isPublished: formData.get("isPublished") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    category: String(formData.get("category") ?? "drinks") as ProductInput["category"],
  };
}

export function validateProductInput(input: ProductInput): string | null {
  if (!input.sourceKey) return "source_key 不能为空";
  if (!input.name) return "中文名称不能为空";
  if (!input.category) return "请选择分类";
  if (input.price < 0) return "价格不能为负数";
  return null;
}

export interface BatchImportResult {
  filename: string;
  status: "matched" | "unmatched" | "error";
  productName?: string;
  imageUrl?: string;
  message?: string;
}
