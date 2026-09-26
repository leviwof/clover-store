"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCartQtyAction, removeCartItemAction } from "@/lib/cart-actions";
import { QuantityStepper } from "@/components/quantity-stepper";
import { formatPrice } from "@/lib/format";

// One cart row. Props are the narrowed, already-serializable fields of a resolved
// line (never the full product) — quantity is server-clamped before it reaches here.
// The stepper's min is 0 so decrementing off the bottom removes the line.

type Props = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  stock: number;
  qty: number;
};

export function CartLineItem({
  id,
  name,
  slug,
  imageUrl,
  priceCents,
  currency,
  stock,
  qty,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeQty(next: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartQtyAction(id, next);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      await removeCartItemAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-5 px-5 py-5" aria-busy={pending}>
      <a
        href={`/products/${slug}`}
        className="relative block aspect-[3/4] w-20 shrink-0 overflow-hidden border border-line bg-surface"
      >
        <Image src={imageUrl} alt={name} fill sizes="80px" className="object-cover" />
      </a>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <a href={`/products/${slug}`} className="link font-medium">
            {name}
          </a>
          <p className="product-price">{formatPrice(priceCents, currency)} each</p>
          <div className="mt-2 flex items-center gap-4">
            <QuantityStepper
              value={qty}
              min={0}
              max={stock}
              disabled={pending}
              onChange={changeQty}
            />
            <button
              type="button"
              className="link text-caption text-muted"
              onClick={remove}
              disabled={pending}
            >
              Remove
            </button>
          </div>
          {error && (
            <p role="alert" className="auth-error mt-1">
              {error}
            </p>
          )}
        </div>
        <p className="font-medium sm:text-right">{formatPrice(priceCents * qty, currency)}</p>
      </div>
    </div>
  );
}
