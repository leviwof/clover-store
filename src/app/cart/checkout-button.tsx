"use client";

import { useFormStatus } from "react-dom";

// Submit button for the checkout <form> in the cart page. useFormStatus disables
// it while the server action runs, so a double-click can't open two Stripe
// sessions. No Stripe.js here — this only toggles the button's pending state.
export function CheckoutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid" disabled={pending} aria-busy={pending}>
      {pending ? "Redirecting…" : "Proceed to checkout"}
    </button>
  );
}
