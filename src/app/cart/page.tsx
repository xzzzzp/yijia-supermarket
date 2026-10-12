import { fetchProducts } from "@/lib/products.server";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartView } from "@/components/CartView";

export default async function CartPage() {
  const products = await fetchProducts();

  return (
    <ProductCatalogProvider products={products}>
      <LanguageProvider>
        <Header />
        <main className="min-h-screen bg-surface px-5 py-8">
          <CartView />
        </main>
        <Footer />
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
