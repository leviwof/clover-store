import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  getAllCategories,
  getCategoryBySlug,
  getProductsByCategory,
  type Category,
  type ProductWithCategory,
} from "@/db/queries";
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from "@/db/sample-catalog";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Reads live from the DB like the rest of the storefront; regenerate at most
// every 5 minutes rather than rendering fully dynamic on each request.
export const revalidate = 300;

type CollectionData = { category: Category; products: ProductWithCategory[] };

// Resolve a collection (a category plus its products) with the same fail-soft
// fallback as the homepage: on a DB error, serve the sample catalog. Returns
// null when the slug matches no category (→ 404). `cache` dedupes the work
// shared by generateMetadata and the page render within a single request.
const loadCollection = cache(
  async (slug: string): Promise<CollectionData | null> => {
    try {
      const category = await getCategoryBySlug(slug);
      if (!category) return null;
      const products = await getProductsByCategory(category.id);
      return { category, products };
    } catch (err) {
      console.warn(
        "[clover] Database unreachable — rendering the sample catalog. " +
          "Set a real DATABASE_URL in .env and run `npm run db:migrate && npm run db:seed` for live data.\n" +
          (err instanceof Error ? `  ${err.message}` : String(err)),
      );
      const category = SAMPLE_CATEGORIES.find((c) => c.slug === slug) ?? null;
      if (!category) return null;
      const products = SAMPLE_PRODUCTS.filter((p) => p.categoryId === category.id);
      return { category, products };
    }
  },
);

// Pre-render the known collection pages at build; unknown slugs still render
// on demand. Falls back to the sample categories when the DB is unreachable.
export async function generateStaticParams() {
  try {
    const cats = await getAllCategories();
    return cats.map((c) => ({ slug: c.slug }));
  } catch {
    return SAMPLE_CATEGORIES.map((c) => ({ slug: c.slug }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCollection(slug);
  if (!data) return { title: "Collection — Clover Store" };
  return {
    title: `${data.category.name} — Clover Store`,
    description:
      data.category.description ??
      `Shop the ${data.category.name} collection at Clover.`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadCollection(slug);
  if (!data) notFound();
  const { category, products } = data;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          {/* Page header — editorial, consistent with the homepage & arrivals */}
          <div className="flex flex-col gap-4">
            <p className="overline">Collection</p>
            <h1>{category.name}</h1>
            {category.description && <p className="lead">{category.description}</p>}
          </div>

          <hr className="hairline mt-10 mb-12" />

          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((p) => (
                <a key={p.id} href={`/products/${p.slug}`} className="product-card">
                  <div className="product-media">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
                      className="object-cover"
                    />
                    {p.stock === 0 && (
                      <span className="overline absolute left-4 top-4 bg-paper/90 px-2 py-1">Sold out</span>
                    )}
                  </div>
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-price">{formatPrice(p.priceCents, p.currency)}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="lead">
              This collection is being refreshed — no pieces to show just yet.{" "}
              <a href="/arrivals" className="link">See the latest arrivals</a>.
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
