import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProductBySlug, type ProductWithCategory } from "@/db/queries";
import { SAMPLE_PRODUCTS } from "@/db/sample-catalog";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AddToCartForm } from "@/components/add-to-cart-form";

// Same fail-soft cadence as the rest of the storefront: regenerate at most every
// 5 minutes, fall back to the sample catalog on a DB error.
export const revalidate = 300;

// Resolve one active product by slug, with the storefront's DB → sample fallback.
// Returns null when the slug matches nothing (→ 404). `cache` dedupes the work
// shared by generateMetadata and the render within a single request.
const loadProduct = cache(async (slug: string): Promise<ProductWithCategory | null> => {
  try {
    return (await getProductBySlug(slug)) ?? null;
  } catch (err) {
    console.warn(
      "[clover] Database unreachable — rendering the sample catalog. " +
        "Set a real DATABASE_URL in .env and run `npm run db:migrate && npm run db:seed` for live data.\n" +
        (err instanceof Error ? `  ${err.message}` : String(err)),
    );
    return SAMPLE_PRODUCTS.find((p) => p.slug === slug && p.active) ?? null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product — Clover Store" };
  return {
    title: `${product.name} — Clover Store`,
    description: product.description ?? `Shop ${product.name} at Clover.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:gap-16">
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden border border-line bg-surface">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width:768px) 40vw, 100vw"
                className="object-cover"
                priority
              />
              {!inStock && (
                <span className="overline absolute left-4 top-4 bg-paper/90 px-2 py-1">
                  Sold out
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-6">
              {product.category && (
                <p className="overline">
                  <a href={`/collections/${product.category.slug}`} className="link">
                    {product.category.name}
                  </a>
                </p>
              )}
              <h1>{product.name}</h1>
              <p className="text-h3">{formatPrice(product.priceCents, product.currency)}</p>
              {product.description && <p className="lead">{product.description}</p>}

              <hr className="hairline" />

              <AddToCartForm productId={product.id} stock={product.stock} />

              <a href="/arrivals" className="link text-caption text-muted">
                ← Continue shopping
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
