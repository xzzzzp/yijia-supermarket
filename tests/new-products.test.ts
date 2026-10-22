import assert from "node:assert/strict";
import test from "node:test";
import {
  HOME_NEW_PRODUCT_LIMIT,
  NEW_PRODUCT_PAGE_SIZE,
  filterNewProducts,
  homeNewProducts,
  sortProducts,
} from "../src/lib/recommend-products.ts";
import { recommendSortError, validateProductInput, type ProductInput } from "../src/types/admin.ts";
import type { Product } from "../src/types/product.ts";

function product(partial: Partial<Product> & Pick<Product, "id">): Product {
  return {
    id: partial.id,
    sourceKey: partial.id,
    name: partial.name ?? partial.id,
    nameRu: partial.nameRu ?? partial.id,
    nameUz: "",
    spec: "500ml",
    specRu: "",
    specUz: "",
    image: "/products/placeholder.png",
    price: partial.price ?? 1000,
    inStock: partial.inStock ?? true,
    isNew: partial.isNew ?? false,
    recommendSort: partial.recommendSort ?? 0,
    isPublished: partial.isPublished ?? true,
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
    sortOrder: partial.sortOrder ?? 0,
    category: "drinks",
    categoryName: "饮料",
    categoryRoute: "/products/drinks",
  };
}

function input(partial: Partial<ProductInput> = {}): ProductInput {
  return {
    sourceKey: "drinks::cola",
    name: "可乐",
    nameRu: "",
    nameUz: "",
    spec: "",
    specRu: "",
    specUz: "",
    image: "",
    price: 1000,
    inStock: true,
    isNew: true,
    recommendSort: 0,
    isPublished: true,
    sortOrder: 0,
    category: "drinks",
    ...partial,
  };
}

test("new pool is published products checked as 新品推荐, ordered by recommend sort", () => {
  const products = [
    product({ id: "late", isNew: true, recommendSort: 20, createdAt: "2026-03-01" }),
    product({ id: "hidden", isNew: true, isPublished: false, recommendSort: 1 }),
    product({ id: "plain", isNew: false, recommendSort: 0, createdAt: "2026-01-01" }),
    product({ id: "early", isNew: true, recommendSort: 5, createdAt: "2026-02-01" }),
    product({ id: "tie-b", isNew: true, recommendSort: 5, createdAt: "2026-02-02" }),
    product({ id: "out", isNew: false, isPublished: true, recommendSort: -10 }),
  ];

  assert.deepEqual(
    filterNewProducts(products).map((item) => item.id),
    ["early", "tie-b", "late"],
  );
});

test("equal recommend sort breaks ties by createdAt then id", () => {
  const products = [
    product({ id: "b", isNew: true, recommendSort: 1, createdAt: "2026-01-02" }),
    product({ id: "a", isNew: true, recommendSort: 1, createdAt: "2026-01-02" }),
    product({ id: "older", isNew: true, recommendSort: 1, createdAt: "2026-01-01" }),
  ];
  assert.deepEqual(filterNewProducts(products).map((item) => item.id), ["older", "a", "b"]);
});

test("home top 8 matches the default order of the full new-product list", () => {
  const products = Array.from({ length: 10 }, (_, index) =>
    product({
      id: `p${String(index).padStart(2, "0")}`,
      isNew: true,
      recommendSort: 100 - index,
      price: (index + 1) * 1000,
    }),
  );
  products.push(product({ id: "shelf", isNew: false, recommendSort: -1, price: 1 }));

  const pool = filterNewProducts(products);
  const home = homeNewProducts(products);
  const listed = sortProducts(pool, "default", "recommend");

  assert.equal(HOME_NEW_PRODUCT_LIMIT, 8);
  assert.equal(home.length, 8);
  assert.deepEqual(
    home.map((item) => item.id),
    listed.slice(0, 8).map((item) => item.id),
  );
  assert.deepEqual(
    home.map((item) => item.recommendSort),
    [91, 92, 93, 94, 95, 96, 97, 98],
  );
  assert.equal(pool.length, 10);
  assert.equal(NEW_PRODUCT_PAGE_SIZE, 24);
  assert.deepEqual(listed.map((item) => item.id).slice(8), ["p01", "p00"]);
});

test("unchecking 新品推荐 removes the product from home and the list", () => {
  const checked = product({ id: "cola", isNew: true, recommendSort: 1 });
  const unchecked = { ...checked, isNew: false };
  assert.deepEqual(homeNewProducts([checked]).map((item) => item.id), ["cola"]);
  assert.deepEqual(filterNewProducts([unchecked]), []);
  assert.deepEqual(homeNewProducts([unchecked]), []);
});

test("recommend page price sort does not change catalog default order", () => {
  const products = [
    product({ id: "dear", isNew: true, price: 3000, recommendSort: 1, sortOrder: 50 }),
    product({ id: "cheap", isNew: true, price: 1000, recommendSort: 9, sortOrder: 1 }),
  ];
  assert.deepEqual(
    sortProducts(products, "price-asc", "recommend").map((item) => item.id),
    ["cheap", "dear"],
  );
  assert.deepEqual(
    sortProducts(products, "price-desc", "recommend").map((item) => item.id),
    ["dear", "cheap"],
  );
  assert.deepEqual(
    sortProducts(products, "default", "catalog").map((item) => item.id),
    ["cheap", "dear"],
  );
  assert.deepEqual(
    sortProducts(products, "default", "recommend").map((item) => item.id),
    ["dear", "cheap"],
  );
});

test("recommend sort must be an integer in range and stays with the new-product flag", () => {
  assert.equal(recommendSortError(0), null);
  assert.equal(recommendSortError(-3), null);
  assert.equal(recommendSortError(1.5), "推荐排序必须是 -1000000 到 1000000 之间的整数");
  assert.equal(validateProductInput(input({ isNew: true, recommendSort: 12 })), null);
  assert.equal(validateProductInput(input({ isNew: false, recommendSort: 12 })), null);
  assert.match(validateProductInput(input({ recommendSort: Number.NaN })) ?? "", /推荐排序/);
});
