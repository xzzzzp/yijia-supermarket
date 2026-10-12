import { fetchProducts } from "@/lib/products.server";
import { searchProducts } from "@/lib/products";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
        <Header />
        <main className="min-h-screen bg-surface">
          <ProductList products={products} title={q ? `"${q}"` : undefined} />
        </main>
        <Footer />
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
