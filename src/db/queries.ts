import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { categories, products } from "./schema";

// Typed read helpers for server components. Relative imports keep these runnable
// from scripts (e.g. `tsx`) as well as from the Next.js runtime.

export type ProductWithCategory = Awaited<
  ReturnType<typeof getLatestProducts>
>[number];

/** A single category row, as returned by the category read helpers. */
export type Category = Awaited<ReturnType<typeof getAllCategories>>[number];

/** Newest active products, with their category joined in. */
export function getLatestProducts(limit = 8) {
  return db.query.products.findMany({
    where: eq(products.active, true),
    orderBy: [desc(products.createdAt)],
    limit,
    with: { category: true },
  });
}

/** Active products in a single category, newest first, with the category joined. */
export function getProductsByCategory(categoryId: string) {
  return db.query.products.findMany({
    where: and(eq(products.active, true), eq(products.categoryId, categoryId)),
    orderBy: [desc(products.createdAt)],
    with: { category: true },
  });
}

/** A single active product by its unique slug, with its category joined, or undefined. */
export function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.active, true)),
    with: { category: true },
  });
}

/** Active products for a set of ids (used to resolve the cart), with categories joined. */
export function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([]);
  return db.query.products.findMany({
    where: and(eq(products.active, true), inArray(products.id, ids)),
    with: { category: true },
  });
}

/** A single category by its unique slug, or undefined if none matches. */
export function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
}

/** The curated "collections" — categories flagged as featured. */
export function getFeaturedCategories(limit = 3) {
  return db.query.categories.findMany({
    where: eq(categories.featured, true),
    orderBy: [categories.sortOrder],
    limit,
  });
}

/** Every category, in display order. */
export function getAllCategories() {
  return db.query.categories.findMany({
    orderBy: [categories.sortOrder],
  });
}
