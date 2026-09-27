import type { Metadata } from "next";
import { stripe } from "@/lib/stripe";
import { finalizeOrder, getOrderBySessionId, type OrderWithItems } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = {
  title: "Order confirmed — Clover Store",
};

// Post-payment landing. The webhook is the source of truth, but Stripe redirects
// here immediately, so this page ALSO verifies the session and finalizes as an
// idempotent fallback (safe if the webhook is delayed or missed). We verify with
// Stripe directly — the session_id in the URL is never trusted as proof of payment.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let paid = false;
  let order: OrderWithItems | null = null;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const result = await finalizeOrder({
          sessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          email: session.customer_details?.email ?? session.customer_email ?? null,
        });
        paid = true;
        order = result.ok ? result.order : await getOrderBySessionId(session.id) ?? null;
      }
    } catch (err) {
      console.error("[clover] success page could not verify session:", err);
    }
  }

  return (
    <>
      <SiteHeader />
      {paid && <ClearCart />}

      <main>
        <section className="container-luxe section">
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            {paid ? (
              <>
                <div className="flex flex-col gap-3">
                  <p className="overline">Thank you</p>
                  <h1>Order confirmed</h1>
                  <p className="lead">
                    We&rsquo;ve received your payment and your order is being prepared.
                  </p>
                </div>

                {order && (
                  <div className="flex flex-col gap-6">
                    <div className="border border-line">
                      {order.items.map((item, i) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-5 py-4 ${
                            i > 0 ? "border-t border-line" : ""
                          }`}
                        >
                          <span>
                            {item.productName} &times; {item.quantity}
                          </span>
                          <span>{formatPrice(item.lineCents, order.currency)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="overline">Total paid</span>
                      <span className="text-h3">
                        {formatPrice(order.amountTotalCents, order.currency)}
                      </span>
                    </div>
                    <p className="text-caption text-muted">Order reference: {order.id}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <a href="/account/orders" className="btn btn-solid">
                    View your orders
                  </a>
                  <a href="/arrivals" className="btn btn-outline">
                    Continue shopping
                  </a>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-5">
                <p className="overline">Payment</p>
                <h1>We couldn&rsquo;t confirm your payment</h1>
                <p className="lead">
                  If you completed payment, your confirmation will appear shortly. Otherwise,
                  your bag is still saved.
                </p>
                <a href="/cart" className="btn btn-outline">
                  Return to your bag
                </a>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
