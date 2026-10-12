import type { Metadata } from "next";
import { fetchProducts } from "@/lib/products.server";
import { filterNewProducts } from "@/lib/products";
import { STORE_CONFIG } from "@/lib/config";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: `${STORE_CONFIG.name} — 塔什干中国商品配送`,
  description: STORE_CONFIG.name,
};

export default async function Home() {
  const products = await fetchProducts();
  const newProducts = filterNewProducts(products);

  return (
    <ProductCatalogProvider products={products}>
      <LanguageProvider>
        <Header />
        <HomePage newProducts={newProducts} />
        <Footer />
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
