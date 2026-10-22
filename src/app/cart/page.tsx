import { fetchProducts } from "@/lib/products.server";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import { CartView } from "@/components/CartView";

export default async function CartPage() {
  const products = await fetchProducts();

  return (
    <ProductCatalogProvider products={products}>
      <LanguageProvider>
        <StorefrontShell>
          <main className="min-h-screen bg-surface">
            <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
              <CartView />
            </div>
          </main>
        </StorefrontShell>
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
