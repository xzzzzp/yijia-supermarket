import { categoriesForProductForm } from "@/lib/categories";
import { listCategories } from "@/lib/categories.server";
import { fetchProducts } from "@/lib/products.server";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { StorefrontShell } from "@/components/StorefrontShell";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const [products, directory] = await Promise.all([fetchProducts(), listCategories()]);
  const categories = categoriesForProductForm(directory.categories);

  return (
    <ProductCatalogProvider products={products}>
      <LanguageProvider>
        <StorefrontShell>
          <CategoryBrowser categories={categories} products={products} initialSlug={c} />
        </StorefrontShell>
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
