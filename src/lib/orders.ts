import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import type { ResolvedCart } from "@/lib/cart";

// Order lifecycle for the checkout phase. The Neon HTTP driver has no interactive
// transactions, so duplicate-safety is built from atomic single-statement claims
// instead: finalizeOrder() flips pending->paid and stock_adjusted false->true with
// conditional UPDATEs, so concurrent webhook + success-page calls (and Stripe's
// webhook retries) each finalize the same order exactly once. Money is integer
// cents; every line snapshots name + unit price so the record never shifts.

type FinalizeParams = {
  sessionId: string;
  paymentIntentId: string | null;
  email?: string | null;
};

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrderBySessionId>>>;

type FinalizeResult =
  | { ok: true; order: OrderWithItems; finalized: boolean }
  | { ok: false; reason: "not_found" };

/**
 * Create a "pending" order (+ line items) from the server-resolved cart. Every
 * amount comes from `cart` (derived from DB priceCents), never from the client.
 * Returns the new order id, which is threaded to Stripe as metadata/reference.
 */
export async function createPendingOrder(
  userId: string,
  email: string | null,
  cart: ResolvedCart,
): Promise<string> {
  const orderId = randomUUID();

  await db.insert(orders).values({
    id: orderId,
    userId,
    status: "pending",
    currency: cart.currency,
    subtotalCents: cart.subtotalCents,
    // v1 has no tax/shipping lines, so the charged total equals the subtotal.
    amountTotalCents: cart.subtotalCents,
    email,
  });

  await db.insert(orderItems).values(
    cart.lines.map((line) => ({
      orderId,
      productId: line.product.id,
      productName: line.product.name,
      productSlug: line.product.slug,
      unitPriceCents: line.product.priceCents,
      quantity: line.qty,
      lineCents: line.lineCents,
      currency: line.product.currency,
    })),
  );

  return orderId;
}

/** Record the Stripe Checkout Session id on the order right after creation. */
export async function attachStripeSession(orderId: string, sessionId: string): Promise<void> {
  await db
    .update(orders)
    .set({ stripeSessionId: sessionId, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

/** Load an order (with its line items) by the Stripe session it was paid through. */
export async function getOrderBySessionId(sessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, sessionId),
    with: { items: true },
  });
}

/** A user's orders, newest first, for the account order-history page. */
export async function getOrdersByUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    with: { items: true },
  });
}

/**
 * Finalize a paid order. Idempotent and duplicate-safe without a transaction:
 *  1. Atomically flip pending -> paid (only one caller wins the claim).
 *  2. Atomically flip stock_adjusted false -> true; only that winner decrements
 *     stock, so stock is reduced exactly once even under concurrent callers.
 * Safe to call repeatedly (webhook is the source of truth; success page a fallback).
 */
export async function finalizeOrder(params: FinalizeParams): Promise<FinalizeResult> {
  const { sessionId, paymentIntentId, email } = params;

  // 1. Claim: flip the one pending row for this session to paid.
  await db
    .update(orders)
    .set({
      status: "paid",
      stripePaymentIntentId: paymentIntentId ?? undefined,
      email: email ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.status, "pending")))
    .returning({ id: orders.id });

  const order = await getOrderBySessionId(sessionId);
  if (!order) {
    console.warn(`[clover] finalizeOrder: no order for session ${sessionId}`);
    return { ok: false, reason: "not_found" };
  }

  // 2. Decrement stock exactly once, guarded by the atomic stock_adjusted flip.
  if (order.status === "paid" && !order.stockAdjusted) {
    const claimed = await db
      .update(orders)
      .set({ stockAdjusted: true, updatedAt: new Date() })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, "paid"),
          eq(orders.stockAdjusted, false),
        ),
      )
      .returning({ id: orders.id });

    if (claimed.length === 1) {
      await decrementStock(order.id, order.items);
    }
  }

  return { ok: true, order, finalized: order.status !== "pending" };
}

/**
 * Best-effort stock decrement for a paid order. Each line uses a conditional
 * UPDATE (stock >= quantity) so it never drives stock negative; if any line
 * can't be satisfied the order is flagged needs_attention for manual review.
 */
async function decrementStock(
  orderId: string,
  items: { productId: string | null; quantity: number }[],
): Promise<void> {
  let shortfall = false;
  for (const item of items) {
    if (!item.productId) {
      shortfall = true; // product was deleted after purchase — can't adjust
      continue;
    }
    const adjusted = await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
      .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
      .returning({ id: products.id });
    if (adjusted.length === 0) shortfall = true;
  }

  if (shortfall) {
    await db
      .update(orders)
      .set({ status: "needs_attention", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    console.error(
      `[clover] order ${orderId} paid but stock was insufficient at fulfillment — flagged needs_attention.`,
    );
  }
}

/** Mark a still-pending order cancelled when its checkout session expires. */
export async function cancelPendingOrder(sessionId: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.status, "pending")));
}

/** Mark a still-pending order failed when an async payment fails. */
export async function failPendingOrder(sessionId: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "failed", updatedAt: new Date() })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.status, "pending")));
}
