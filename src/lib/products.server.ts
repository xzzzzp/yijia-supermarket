import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { mapProductRow, SEED_PRODUCTS } from "@/lib/products";
import type { Product } from "@/types/product";

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return SEED_PRODUCTS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      console.warn("Supabase fetch failed, using seed data:", error?.message);
      return SEED_PRODUCTS;
    }

    return data.map(mapProductRow);
  } catch (err) {
    console.warn("Supabase unavailable, using seed data:", err);
    return SEED_PRODUCTS;
  }
}

export async function fetchAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return SEED_PRODUCTS;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return SEED_PRODUCTS;
  return data.map(mapProductRow);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return SEED_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapProductRow(data);
}
