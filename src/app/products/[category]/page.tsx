import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories.server";
import { fetchProducts } from "@/lib/products.server";
import { filterByCategory, filterNewProducts, NEW_PRODUCT_PAGE_SIZE } from "@/lib/products";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import { ProductList } from "@/components/ProductList";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const allProducts = await fetchProducts();

  if (category === "new") {
    return (
      <ProductCatalogProvider products={allProducts}>
        <LanguageProvider>
          <StorefrontShell>
            <main className="min-h-screen bg-surface">
              <ProductList
              products={filterNewProducts(allProducts)}
              sortMode="recommend"
              pageSize={NEW_PRODUCT_PAGE_SIZE}
            />
            </main>
          </StorefrontShell>
        </LanguageProvider>
      </ProductCatalogProvider>
    );
  }

  const categoryInfo = await getCategoryBySlug(category);
  if (!categoryInfo || !categoryInfo.enabled) {
    notFound();
  }

  return (
    <ProductCatalogProvider products={allProducts}>
      <LanguageProvider>
        <StorefrontShell>
          <main className="min-h-screen bg-surface">
            <ProductList products={filterByCategory(allProducts, category)} categoryInfo={categoryInfo} />
          </main>
        </StorefrontShell>
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
