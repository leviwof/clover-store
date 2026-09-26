import "dotenv/config";
import { db } from "./index";
import { categories, products } from "./schema";

// Seeds the sample catalog carried over from the original hardcoded homepage.
// Only the commerce tables are touched — the Better Auth tables are left alone.
// Run with: `npm run db:seed`.

// Full Unsplash URLs (sample imagery — swap for owned assets before launch).
const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// 7 categories. The first three are `featured` — they fill the "Featured
// collections" tiles; `description` doubles as each tile's overline. The rest
// populate the "Shop by category" grid.
const CATEGORY_SEED = [
  { name: "Women", slug: "women", description: "Autumn / Winter", imageUrl: img("photo-1490481651871-ab68de25d43d"), featured: true, sortOrder: 0 },
  { name: "Men", slug: "men", description: "The Tailoring Edit", imageUrl: img("photo-1434389677669-e08b4cac3105"), featured: true, sortOrder: 1 },
  { name: "Accessories", slug: "accessories", description: "Bags & Leather Goods", imageUrl: img("photo-1591047139829-d91aecb6caea"), featured: true, sortOrder: 2 },
  { name: "Handbags", slug: "handbags", description: "Structured shapes in full-grain leather.", imageUrl: img("photo-1591561954557-26941169b49e"), featured: false, sortOrder: 3 },
  { name: "Shoes", slug: "shoes", description: "Hand-finished loafers and boots.", imageUrl: img("photo-1549298916-b41d501d3772"), featured: false, sortOrder: 4 },
  { name: "Ready-to-Wear", slug: "ready-to-wear", description: "Considered tailoring and knitwear.", imageUrl: img("photo-1445205170230-053b83016050"), featured: false, sortOrder: 5 },
  { name: "Jewellery", slug: "jewellery", description: "Quiet gold, worn every day.", imageUrl: img("photo-1515562141207-7a88fb7ce338"), featured: false, sortOrder: 6 },
];

// 8 products, keyed to a category slug. Prices are integer cents; one item is
// left at stock 0 to exercise the "Sold out" state on the storefront.
const PRODUCT_SEED = [
  { name: "Double-Breasted Wool Coat", slug: "double-breasted-wool-coat", description: "A structured wool coat with a clean double-breasted front.", priceCents: 245000, imageUrl: img("photo-1539109136881-3be0616acf4b", 800), stock: 12, featured: true, categorySlug: "ready-to-wear" },
  { name: "Silk Twill Scarf", slug: "silk-twill-scarf", description: "Hand-rolled silk twill, printed in a muted archive motif.", priceCents: 39000, imageUrl: img("photo-1521572163474-6864f9cf17ab", 800), stock: 45, featured: false, categorySlug: "accessories" },
  { name: "Structured Leather Tote", slug: "structured-leather-tote", description: "A full-grain leather tote that holds its shape.", priceCents: 189000, imageUrl: img("photo-1584917865442-de89df76afd3", 800), stock: 8, featured: true, categorySlug: "handbags" },
  { name: "Cashmere Crew Knit", slug: "cashmere-crew-knit", description: "Pure cashmere in a relaxed crew-neck.", priceCents: 78000, imageUrl: img("photo-1523381210434-271e8be1f52b", 800), stock: 20, featured: false, categorySlug: "ready-to-wear" },
  { name: "Tailored Wool Trouser", slug: "tailored-wool-trouser", description: "A straight-leg trouser cut from Italian wool.", priceCents: 62000, imageUrl: img("photo-1441984904996-e0b6ba687e04", 800), stock: 15, featured: false, categorySlug: "men" },
  { name: "Suede Loafer", slug: "suede-loafer", description: "Hand-stitched suede loafer with a leather sole.", priceCents: 74000, imageUrl: img("photo-1549298916-b41d501d3772", 800), stock: 6, featured: false, categorySlug: "shoes" },
  { name: "Cotton Poplin Shirt", slug: "cotton-poplin-shirt", description: "Crisp cotton poplin with a clean point collar.", priceCents: 46000, imageUrl: img("photo-1483985988355-763728e1935b", 800), stock: 30, featured: false, categorySlug: "men" },
  { name: "Quilted Shoulder Bag", slug: "quilted-shoulder-bag", description: "A quilted leather shoulder bag on a slim chain.", priceCents: 165000, imageUrl: img("photo-1560243563-062bfc001d68", 800), stock: 0, featured: true, categorySlug: "handbags" },
];

async function seed() {
  // Clear commerce rows first (products before categories to respect the FK).
  await db.delete(products);
  await db.delete(categories);

  const insertedCategories = await db.insert(categories).values(CATEGORY_SEED).returning();
  const idBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // Stagger createdAt so `getLatestProducts` (orders by createdAt desc) returns
  // them in the array order above — a single batch insert would otherwise share
  // one now() timestamp and order arbitrarily.
  const now = Date.now();
  const productRows = PRODUCT_SEED.map((p, i) => ({
    name: p.name,
    slug: p.slug,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    stock: p.stock,
    featured: p.featured,
    categoryId: idBySlug.get(p.categorySlug) ?? null,
    createdAt: new Date(now - i * 60_000),
  }));
  const insertedProducts = await db.insert(products).values(productRows).returning();

  console.log(
    `Seeded ${insertedCategories.length} categories and ${insertedProducts.length} products.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
