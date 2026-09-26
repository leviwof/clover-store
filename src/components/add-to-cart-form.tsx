"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/lib/cart-actions";
import { QuantityStepper } from "@/components/quantity-stepper";

// PDP add-to-cart control. The stepper is bounded [1..stock] as a UX nicety; the
// server action re-validates and clamps to live stock, so this is never trusted.

export function AddToCartForm({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (stock <= 0) {
    return (
      <div className="flex flex-col gap-3">
        <button type="button" className="btn btn-solid" disabled>
          Sold out
        </button>
        <p className="text-caption text-muted">This piece is currently unavailable.</p>
      </div>
    );
  }

  function onAdd() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await addToCartAction(productId, qty);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        result.cappedAtStock
          ? `Only ${result.stock ?? stock} in stock — we added the maximum available.`
          : "Added to your bag.",
      );
      // Refresh so the header bag count reflects the new server state.
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <QuantityStepper value={qty} min={1} max={stock} disabled={pending} onChange={setQty} />
        <span className="text-caption text-muted">{stock} in stock</span>
      </div>
      <button
        type="button"
        className="btn btn-solid"
        onClick={onAdd}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Adding…
          </>
        ) : (
          "Add to cart"
        )}
      </button>
      {message && (
        <p role="status" className="text-caption text-muted">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
