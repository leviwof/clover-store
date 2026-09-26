import type { Category, ProductWithCategory } from "./queries";

// Fallback catalog used by the storefront when the database is unreachable
// (e.g. DATABASE_URL not yet pointed at a real Neon instance, or before
// db:migrate + db:seed have run). It mirrors the seed data so the homepage
// renders identically to a freshly seeded DB. This is display-only sample data;
// it is never written back and is bypassed entirely once the DB responds.

const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// A fixed timestamp keeps the sample rows deterministic across renders.
const t = new Date("2026-01-01T00:00:00.000Z");

export const SAMPLE_CATEGORIES: Category[] = [
  { id: "sample-women", name: "Women", slug: "women", description: "Autumn / Winter", imageUrl: img("photo-1490481651871-ab68de25d43d"), featured: true, sortOrder: 0, createdAt: t, updatedAt: t },
  { id: "sample-men", name: "Men", slug: "men", description: "The Tailoring Edit", imageUrl: img("photo-1434389677669-e08b4cac3105"), featured: true, sortOrder: 1, createdAt: t, updatedAt: t },
  { id: "sample-accessories", name: "Accessories", slug: "accessories", description: "Bags & Leather Goods", imageUrl: img("photo-1591047139829-d91aecb6caea"), featured: true, sortOrder: 2, createdAt: t, updatedAt: t },
  { id: "sample-handbags", name: "Handbags", slug: "handbags", description: "Structured shapes in full-grain leather.", imageUrl: img("photo-1591561954557-26941169b49e"), featured: false, sortOrder: 3, createdAt: t, updatedAt: t },
  { id: "sample-shoes", name: "Shoes", slug: "shoes", description: "Hand-finished loafers and boots.", imageUrl: img("photo-1549298916-b41d501d3772"), featured: false, sortOrder: 4, createdAt: t, updatedAt: t },
  { id: "sample-rtw", name: "Ready-to-Wear", slug: "ready-to-wear", description: "Considered tailoring and knitwear.", imageUrl: img("photo-1445205170230-053b83016050"), featured: false, sortOrder: 5, createdAt: t, updatedAt: t },
  { id: "sample-jewellery", name: "Jewellery", slug: "jewellery", description: "Quiet gold, worn every day.", imageUrl: img("photo-1515562141207-7a88fb7ce338"), featured: false, sortOrder: 6, createdAt: t, updatedAt: t },
];

export const SAMPLE_PRODUCTS: ProductWithCategory[] = [
  { id: "sample-coat", name: "Double-Breasted Wool Coat", slug: "double-breasted-wool-coat", description: "A structured wool coat with a clean double-breasted front.", priceCents: 245000, currency: "USD", imageUrl: img("photo-1539109136881-3be0616acf4b", 800), stock: 12, featured: true, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-scarf", name: "Silk Twill Scarf", slug: "silk-twill-scarf", description: "Hand-rolled silk twill, printed in a muted archive motif.", priceCents: 39000, currency: "USD", imageUrl: img("photo-1521572163474-6864f9cf17ab", 800), stock: 45, featured: false, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-tote", name: "Structured Leather Tote", slug: "structured-leather-tote", description: "A full-grain leather tote that holds its shape.", priceCents: 189000, currency: "USD", imageUrl: img("photo-1584917865442-de89df76afd3", 800), stock: 8, featured: true, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-knit", name: "Cashmere Crew Knit", slug: "cashmere-crew-knit", description: "Pure cashmere in a relaxed crew-neck.", priceCents: 78000, currency: "USD", imageUrl: img("photo-1523381210434-271e8be1f52b", 800), stock: 20, featured: false, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-trouser", name: "Tailored Wool Trouser", slug: "tailored-wool-trouser", description: "A straight-leg trouser cut from Italian wool.", priceCents: 62000, currency: "USD", imageUrl: img("photo-1441984904996-e0b6ba687e04", 800), stock: 15, featured: false, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-loafer", name: "Suede Loafer", slug: "suede-loafer", description: "Hand-stitched suede loafer with a leather sole.", priceCents: 74000, currency: "USD", imageUrl: img("photo-1549298916-b41d501d3772", 800), stock: 6, featured: false, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-shirt", name: "Cotton Poplin Shirt", slug: "cotton-poplin-shirt", description: "Crisp cotton poplin with a clean point collar.", priceCents: 46000, currency: "USD", imageUrl: img("photo-1483985988355-763728e1935b", 800), stock: 30, featured: false, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
  { id: "sample-bag", name: "Quilted Shoulder Bag", slug: "quilted-shoulder-bag", description: "A quilted leather shoulder bag on a slim chain.", priceCents: 165000, currency: "USD", imageUrl: img("photo-1560243563-062bfc001d68", 800), stock: 0, featured: true, active: true, categoryId: null, createdAt: t, updatedAt: t, category: null },
];
