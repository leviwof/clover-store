"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { readCartCookie, resolveCart, writeCartCookie } from "@/lib/cart";
import { stripe } from "@/lib/stripe";
import { createPendingOrder, attachStripeSession } from "@/lib/orders";

// Checkout server actions. Login is required; the cart is re-resolved from the DB
// (authoritative pricing + live stock) right before the Stripe session opens, so
// nothing the client sends can change price, quantity or availability.

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Start Stripe Hosted Checkout for the current cart. Requires sign-in, re-resolves
 * the cart server-side, and — if live stock/pricing changed since the shopper last
 * looked — reconciles the cookie and bounces back to /cart for review instead of
 * charging. Otherwise creates a pending order and redirects to Stripe's hosted page.
 */
export async function createCheckoutSession(): Promise<void> {
  const { user } = await requireUser("/cart");

  const cookie = await readCartCookie();
  const cart = await resolveCart(cookie);

  if (cart.lines.length === 0) redirect("/cart");

  // Server-side validation gate: never open a session for a cart we couldn't
  // confirm. Reconcile the cookie to what's actually available, then send the
  // shopper back to review the adjusted bag.
  if (cart.reduced || cart.removed) {
    await writeCartCookie({
      v: cookie.v,
      items: cart.lines.map((line) => ({ id: line.product.id, qty: line.qty })),
    });
    revalidatePath("/cart");
    redirect("/cart?adjusted=1");
  }

  let checkoutUrl: string | null = null;
  try {
    const orderId = await createPendingOrder(user.id, user.email, cart);

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        // Line items are built only from server-resolved lines (DB cents).
        line_items: cart.lines.map((line) => ({
          quantity: line.qty,
          price_data: {
            currency: cart.currency.toLowerCase(),
            unit_amount: line.product.priceCents,
            product_data: {
              name: line.product.name,
              images: line.product.imageUrl ? [line.product.imageUrl] : undefined,
            },
          },
        })),
        client_reference_id: orderId,
        metadata: { orderId },
        customer_email: user.email,
        success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl()}/cart`,
      },
      // Ties this order's session to one Stripe request, so an action retry can't
      // open a second session for the same pending order.
      { idempotencyKey: `checkout_${orderId}` },
    );

    await attachStripeSession(orderId, session.id);
    checkoutUrl = session.url;
  } catch (err) {
    console.error("[clover] failed to create Stripe checkout session", err);
    redirect("/cart?error=1");
  }

  if (!checkoutUrl) redirect("/cart?error=1");

  // External redirect to Stripe's hosted page — outside the try/catch, since
  // redirect() throws NEXT_REDIRECT which must not be swallowed.
  redirect(checkoutUrl);
}

/** Clear the cart cookie after a confirmed order (invoked from the success page). */
export async function clearCartAction(): Promise<void> {
  const cookie = await readCartCookie();
  await writeCartCookie({ v: cookie.v, items: [] }); // empty items → cookie deleted
  revalidatePath("/", "layout");
}
