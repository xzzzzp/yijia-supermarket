export type StorefrontTab = "home" | "categories" | "cart" | "orders";

export function activeStorefrontTab(pathname: string): StorefrontTab | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (path === "/") return "home";
  if (path === "/categories" || path.startsWith("/products")) return "categories";
  if (path === "/cart" || path === "/checkout") return "cart";
  if (path === "/orders" || path.startsWith("/order")) return "orders";
  return null;
}
