import type { Metadata } from "next";
import { resolveCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { createCheckoutSession } from "@/lib/checkout-actions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartLineItem } from "@/components/cart-line-item";
import { CheckoutButton } from "./checkout-button";

export const metadata: Metadata = {
  title: "Your Bag — Clover Store",
};

// Reads the cart cookie, so this route renders dynamically. resolveCart() is the
// authoritative pricing + stock guard: quantities and the subtotal shown here can
// never exceed live stock, even if the cookie was tampered with.
export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ adjusted?: string; error?: string }>;
}) {
  const { adjusted, error } = await searchParams;
  const cart = await resolveCart();
  const empty = cart.lines.length === 0;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          <div className="mx-auto flex max-w-4xl flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="overline">Your bag</p>
              <h1>Shopping bag</h1>
            </div>

            {(adjusted || error) && (
              <div role="status" className="auth-error flex flex-col gap-1">
                {adjusted && (
                  <p>
                    We updated your bag to match current availability. Please review it and
                    check out again.
                  </p>
                )}
                {error && <p>Something went wrong starting checkout. Please try again.</p>}
              </div>
            )}

            {empty ? (
              <div className="flex flex-col items-start gap-5">
                <p className="lead">Your bag is empty.</p>
                <a href="/arrivals" className="btn btn-outline">
                  Browse new arrivals
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {(cart.removed || cart.reduced) && (
                  <div role="status" className="auth-error flex flex-col gap-1">
                    {cart.removed && (
                      <p>We removed items that are no longer available.</p>
                    )}
                    {cart.reduced && (
                      <p>We reduced some quantities to match what&rsquo;s currently in stock.</p>
                    )}
                  </div>
                )}

                <div className="border border-line">
                  {cart.lines.map((line, i) => (
                    <div key={line.product.id} className={i > 0 ? "border-t border-line" : ""}>
                      <CartLineItem
                        id={line.product.id}
                        name={line.product.name}
                        slug={line.product.slug}
                        imageUrl={line.product.imageUrl}
                        priceCents={line.product.priceCents}
                        currency={line.product.currency}
                        stock={line.product.stock}
                        qty={line.qty}
                      />
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="flex flex-col items-end gap-4">
                  <div className="flex w-full max-w-xs items-center justify-between">
                    <span className="overline">Subtotal</span>
                    <span className="text-h3">
                      {formatPrice(cart.subtotalCents, cart.currency)}
                    </span>
                  </div>
                  <p className="text-caption text-muted">
                    Taxes and shipping calculated at checkout.
                  </p>
                  <form action={createCheckoutSession}>
                    <CheckoutButton />
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
