import { connection } from "next/server";
import { fetchProducts } from "@/lib/products.server";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { CheckoutForm } from "@/components/CheckoutForm";
import { StorefrontShell } from "@/components/StorefrontShell";

export default async function CheckoutPage() {
  // 与购物车页相同：结算也按 id 关联目录，不能使用构建时烤进去的商品快照。
  await connection();
  const products = await fetchProducts();

  return (
    <ProductCatalogProvider products={products}>
      <LanguageProvider>
        <StorefrontShell>
          <CheckoutForm />
        </StorefrontShell>
      </LanguageProvider>
    </ProductCatalogProvider>
  );
}
