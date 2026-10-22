import { connection } from "next/server";
import { fetchProducts } from "@/lib/products.server";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import { CartView } from "@/components/CartView";

export default async function CartPage() {
  // 构建时若能连上数据库，这份目录会被写进静态页。之后上架的商品不在其中，
  // 购物车按 id 关联会丢掉这些行；分类页是动态的，角标和步进器仍能看到它们。
  await connection();
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
