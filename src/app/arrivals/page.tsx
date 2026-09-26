import Image from "next/image";
import type { Metadata } from "next";
import { getLatestProducts, type ProductWithCategory } from "@/db/queries";
import { SAMPLE_PRODUCTS } from "@/db/sample-catalog";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Reads live from the DB like the homepage. Regenerate at most every 5 minutes
// rather than rendering fully dynamic on each request.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "New Arrivals — Clover Store",
  description:
    "The latest arrivals at Clover — the newest pieces added to the collection.",
};

// Show a fuller grid than the homepage preview; a real catalog fills several
// rows, while the current sample catalog simply shows everything it has.
const ARRIVALS_LIMIT = 24;

export default async function ArrivalsPage() {
  let products: ProductWithCategory[];

  try {
    products = await getLatestProducts(ARRIVALS_LIMIT);
  } catch (err) {
    // No reachable DB yet (placeholder DATABASE_URL, or db:migrate/db:seed not
    // run). Fall back to the sample catalog so the page still renders — mirrors
    // the homepage's fail-soft behaviour.
    console.warn(
      "[clover] Database unreachable — rendering the sample catalog. " +
        "Set a real DATABASE_URL in .env and run `npm run db:migrate && npm run db:seed` for live data.\n" +
        (err instanceof Error ? `  ${err.message}` : String(err)),
    );
    products = SAMPLE_PRODUCTS;
  }

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          {/* Page header — editorial, consistent with the homepage sections */}
          <div className="flex flex-col gap-4">
            <p className="overline">New in</p>
            <h1>The Latest Arrivals</h1>
            <p className="lead">
              The newest additions to the Clover wardrobe — considered pieces,
              added as they land.
            </p>
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
            <p className="lead">No arrivals to show just yet — check back soon.</p>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
