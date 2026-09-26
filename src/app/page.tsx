import Image from "next/image";
import {
  getAllCategories,
  getFeaturedCategories,
  getLatestProducts,
  type Category,
  type ProductWithCategory,
} from "@/db/queries";
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from "@/db/sample-catalog";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// The storefront reads live from the DB. Keep `/` cached and regenerate at most
// every 5 minutes rather than rendering fully dynamic on each request.
export const revalidate = 300;

// Sample imagery from Unsplash for the static editorial sections (swap for owned
// assets before launch). Catalog images come from the DB rows themselves.
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export default async function Home() {
  let collections: Category[];
  let categories: Category[];
  let products: ProductWithCategory[];

  try {
    [collections, categories, products] = await Promise.all([
      getFeaturedCategories(),
      getAllCategories(),
      getLatestProducts(8),
    ]);
  } catch (err) {
    // No reachable DB yet (placeholder DATABASE_URL, or db:migrate/db:seed not
    // run). Fall back to the sample catalog so the storefront still renders —
    // set a real DATABASE_URL and run `npm run db:migrate && npm run db:seed`
    // for live, editable data.
    console.warn(
      "[clover] Database unreachable — rendering the sample catalog. " +
        "Set a real DATABASE_URL in .env and run `npm run db:migrate && npm run db:seed` for live data.\n" +
        (err instanceof Error ? `  ${err.message}` : String(err)),
    );
    collections = SAMPLE_CATEGORIES.filter((c) => c.featured).slice(0, 3);
    categories = SAMPLE_CATEGORIES;
    products = SAMPLE_PRODUCTS.slice(0, 8);
  }


  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero — full-bleed editorial image with overlaid display type */}
        <section className="relative">
          <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
            <Image
              src={img("photo-1441986300917-64674bd600d8", 2000)}
              alt="Autumn collection editorial"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="scrim" />
          </div>
          <div className="absolute inset-0 flex items-end">
            <div className="container-luxe on-dark pb-14 md:pb-20">
              <p className="overline">Autumn / Winter 2026</p>
              <h1 className="display mt-4 max-w-[15ch]">The art of quiet luxury.</h1>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#new" className="btn btn-light">Shop new in</a>
                <a href="#collections" className="btn btn-outline">Explore collections</a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured collections — large editorial tiles */}
        <section id="collections" className="container-luxe section">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <p className="overline">Featured</p>
            <h2>Explore the collections</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {collections.map((c) => (
              <a key={c.id} href={`/collections/${c.slug}`} className="tile aspect-[3/4]">
                <Image src={c.imageUrl ?? img("photo-1490481651871-ab68de25d43d", 900)} alt={c.name} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
                <div className="scrim" />
                <div className="tile-body on-dark">
                  {c.description && <p className="overline">{c.description}</p>}
                  <h3 className="font-display text-2xl">{c.name}</h3>
                  <span className="link nav-link">Discover</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* New arrivals — product-focused grid */}
        <section id="new" className="container-luxe section">
          <div className="mb-10 flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <p className="overline">New in</p>
              <h2>The Latest Arrivals</h2>
            </div>
            <a href="/arrivals" className="link nav-link hidden sm:inline-block">View all</a>
          </div>
          <div className="product-grid">
            {products.map((p) => (
              <a key={p.id} href={`/products/${p.slug}`} className="product-card">
                <div className="product-media">
                  <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw" className="object-cover" />
                  {p.stock === 0 && <span className="overline absolute left-4 top-4 bg-paper/90 px-2 py-1">Sold out</span>}
                </div>
                <h3 className="product-title">{p.name}</h3>
                <p className="product-price">{formatPrice(p.priceCents, p.currency)}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Editorial feature — split image + text */}
        <section className="container-luxe section">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="tile aspect-[4/5]">
              <Image src={img("photo-1487222477894-8943e31ef7b2", 1200)} alt="Craftsmanship at Clover" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col items-start gap-6">
              <p className="overline">The House</p>
              <h2 className="max-w-[16ch]">Craft that endures, not trends that expire.</h2>
              <p className="lead">Every piece is considered in its material and made to be worn for years — a wardrobe built on restraint rather than noise.</p>
              <a href="#" className="btn btn-outline">Our story</a>
            </div>
          </div>
        </section>

        {/* Shop by category — compact square tiles */}
        <section id="categories" className="container-luxe section">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <p className="overline">Shop by category</p>
            <h2>Find your next piece</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {categories.map((c) => (
              <a key={c.id} href={`/collections/${c.slug}`} className="tile aspect-square">
                <Image src={c.imageUrl ?? img("photo-1445205170230-053b83016050", 700)} alt={c.name} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                <div className="scrim" />
                <div className="tile-body on-dark">
                  <h3 className="font-display text-xl">{c.name}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Newsletter — inverted band */}
        <section className="surface-inverse">
          <div className="container-luxe section-lg flex flex-col items-center gap-6 text-center">
            <p className="overline">Stay in touch</p>
            <h2 className="max-w-[18ch]">Considered dispatches, never noise.</h2>
            <form className="mt-2 flex w-full max-w-md items-end gap-4">
              <input type="email" placeholder="Email address" aria-label="Email address" className="field" />
              <button type="submit" className="btn btn-light shrink-0">Subscribe</button>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
