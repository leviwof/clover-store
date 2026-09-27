import Stripe from "stripe";

// Server-only Stripe client. Mirrors the DB's fail-soft pattern (src/db/index.ts):
// a missing key warns at import instead of throwing, so `next build`/`next dev`
// run on a fresh checkout — any real Stripe call then fails at request time.
// NEVER import this from a client component; it holds the secret key.

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn(
    "[clover] STRIPE_SECRET_KEY is not set — checkout will fail until it is set in .env.",
  );
}

export const stripe = new Stripe(secretKey ?? "sk_test_unset", {
  // Pin to the version this SDK (stripe@22) was built against, so bumping the
  // account's default version never silently changes request/response shape.
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});
