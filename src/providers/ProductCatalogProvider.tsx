"use client";

import { createContext, useContext, useMemo } from "react";
import type { Product } from "@/types/product";

interface ProductCatalogContextValue {
  products: Product[];
  getProductById: (id: string) => Product | undefined;
}

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null);

export function ProductCatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      products,
      getProductById: (id: string) => products.find((p) => p.id === id),
    }),
    [products],
  );

  return (
    <ProductCatalogContext.Provider value={value}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductCatalogContext);
  if (!ctx) throw new Error("useProducts must be used within ProductCatalogProvider");
  return ctx;
}
