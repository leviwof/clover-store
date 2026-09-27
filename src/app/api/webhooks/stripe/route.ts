import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  finalizeOrder,
  cancelPendingOrder,
  failPendingOrder,
} from "@/lib/orders";

// Stripe webhook — the source of truth for payment. Node runtime so the Stripe
// SDK can verify the signature with Node crypto; force-dynamic so the raw body is
// never cached/transformed. We read the body with req.text() (raw bytes are
// required for signature verification) and reject anything unsigned/unverified.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

export async function POST(req: Request): Promise<Response> {
  if (!webhookSecret) {
    console.error("[clover] STRIPE_WEBHOOK_SECRET is not set — rejecting webhook.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const payload = await req.text(); // raw body, required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.warn(
      "[clover] webhook signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        // Only finalize once payment is actually captured.
        if (session.payment_status === "paid") {
          await finalizeOrder({
            sessionId: session.id,
            paymentIntentId: paymentIntentId(session),
            email: session.customer_details?.email ?? session.customer_email ?? null,
          });
        }
        break;
      }
      case "checkout.session.expired":
        await cancelPendingOrder(event.data.object.id);
        break;
      case "checkout.session.async_payment_failed":
        await failPendingOrder(event.data.object.id);
        break;
      default:
        break; // ignore unrelated event types
    }
  } catch (err) {
    console.error(`[clover] error handling webhook ${event.type}:`, err);
    // 500 asks Stripe to retry; finalizeOrder is idempotent, so retries are safe.
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
