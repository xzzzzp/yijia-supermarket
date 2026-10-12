import { notFound } from "next/navigation";
import { fetchProducts } from "@/lib/products.server";
import {
  filterByCategory,
  filterNewProducts,
} from "@/lib/products";
import type { ProductCategory } from "@/types/product";
import { getCategoryInfo } from "@/types/product";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductList } from "@/components/ProductList";

const VALID_CATEGORIES = new Set([
  "drinks",
  "snacks",
  "noodles",
  "specialty",
  "hot-drinks",
  "seasonings",
  "side-dishes",
  "drygoods",
  "frozen",
  "seafood",
  "daily-essentials",
  "shoes",
  "case-discount",
  "new",
]);

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!VALID_CATEGORIES.has(category)) {
    notFound();
  }

  const allProducts = await fetchProducts();
  const products =
    category === "new"
      ? filterNewProducts(allProducts)
      : filterByCategory(allProducts, category as ProductCategory);

  const catInfo =
    category !== "new" ? getCategoryInfo(category as ProductCategory) : null;

  return (
    <ProductCatalogProvider products={allProducts}>
      <LanguageProvider>
        <Header />
        <main className="min-h-screen bg-surface">
          <ProductList
            products={products}
            category={category !== "new" ? (category as ProductCategory) : undefined}
          />
        </main>
        <Footer />
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
