import type { Metadata } from "next";
import { categoriesForHome } from "@/lib/categories";
import { listCategories } from "@/lib/categories.server";
import { fetchProducts } from "@/lib/products.server";
import { homeNewProducts } from "@/lib/products";
import { STORE_CONFIG } from "@/lib/config";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: `${STORE_CONFIG.name} — 塔什干中国商品配送`,
  description: STORE_CONFIG.name,
};

export default async function Home() {
  const [products, directory] = await Promise.all([fetchProducts(), listCategories()]);
  const newProducts = homeNewProducts(products);

  return (
    <ProductCatalogProvider products={products}>
      <LanguageProvider>
        <StorefrontShell>
          <HomePage newProducts={newProducts} categories={categoriesForHome(directory.categories)} />
        </StorefrontShell>
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
