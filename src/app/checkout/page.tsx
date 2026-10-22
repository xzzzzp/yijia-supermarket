import { fetchProducts } from "@/lib/products.server";
import { ProductCatalogProvider } from "@/providers/ProductCatalogProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { CheckoutForm } from "@/components/CheckoutForm";
import { StorefrontShell } from "@/components/StorefrontShell";

export default async function CheckoutPage() {
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
