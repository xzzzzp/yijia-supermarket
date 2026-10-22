import { fetchProducts } from "@/lib/products.server";
import { searchProducts } from "@/lib/products";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import { ProductList } from "@/components/ProductList";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const allProducts = await fetchProducts();
  const products = searchProducts(allProducts, q);

  return (
    <ProductCatalogProvider products={allProducts}>
      <LanguageProvider>
        <StorefrontShell>
          <main className="min-h-screen bg-surface">
            <ProductList products={products} title={q ? `"${q}"` : undefined} />
          </main>
        </StorefrontShell>
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
