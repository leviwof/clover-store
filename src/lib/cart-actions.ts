"use server";

import { revalidatePath } from "next/cache";
import {
  readCartCookie,
  writeCartCookie,
  lookupProducts,
  type CartCookieItem,
} from "@/lib/cart";

// Public POST server actions — reachable directly, so each validates its own input.
// The cart is per-cookie (no user data, no secrets), so there's no per-user
// authorization to enforce; the only guards are input validation and the stock rules.
// All stock enforcement here is defense-in-depth: resolveCart() re-clamps on render.

export type CartActionResult =
  | { ok: true; count: number; cappedAtStock: boolean; stock?: number }
  | { ok: false; error: string };

function sumQty(items: CartCookieItem[]): number {
  return items.reduce((total, item) => total + item.qty, 0);
}

function coerceQty(input: unknown): number {
  const n = Number(input);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/** Add `qty` of a product, clamping the resulting line to live stock. */
export async function addToCartAction(
  productId: unknown,
  requestedQty: unknown = 1,
): Promise<CartActionResult> {
  if (typeof productId !== "string" || !productId) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const qty = coerceQty(requestedQty);
  if (!Number.isFinite(qty) || qty < 1) {
    return { ok: false, error: "Choose a valid quantity." };
  }

  const [product] = await lookupProducts([productId]);
  if (!product) return { ok: false, error: "This item is no longer available." };
  if (product.stock <= 0) return { ok: false, error: "This item is sold out." };

  const cart = await readCartCookie();
  const existing = cart.items.find((item) => item.id === productId);
  const desired = (existing?.qty ?? 0) + qty;
  const nextQty = Math.min(desired, product.stock);
  const cappedAtStock = nextQty < desired;

  const items: CartCookieItem[] = existing
    ? cart.items.map((item) => (item.id === productId ? { ...item, qty: nextQty } : item))
    : [...cart.items, { id: productId, qty: nextQty }];

  await writeCartCookie({ v: cart.v, items });
  revalidatePath("/", "layout");
  return { ok: true, count: sumQty(items), cappedAtStock, stock: product.stock };
}

/** Set a line's quantity. `qty <= 0` removes the line; otherwise clamp to live stock. */
export async function updateCartQtyAction(
  productId: unknown,
  requestedQty: unknown,
): Promise<CartActionResult> {
  if (typeof productId !== "string" || !productId) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const qty = coerceQty(requestedQty);
  if (!Number.isFinite(qty)) return { ok: false, error: "Choose a valid quantity." };

  const cart = await readCartCookie();
  const existing = cart.items.find((item) => item.id === productId);
  if (!existing) {
    // Nothing to update (already gone) — treat as a harmless no-op.
    return { ok: true, count: sumQty(cart.items), cappedAtStock: false };
  }

  if (qty <= 0) {
    const items = cart.items.filter((item) => item.id !== productId);
    await writeCartCookie({ v: cart.v, items });
    revalidatePath("/", "layout");
    return { ok: true, count: sumQty(items), cappedAtStock: false };
  }

  const [product] = await lookupProducts([productId]);
  if (!product || product.stock <= 0) {
    // Product vanished or sold out since it was added — drop the line.
    const items = cart.items.filter((item) => item.id !== productId);
    await writeCartCookie({ v: cart.v, items });
    revalidatePath("/", "layout");
    return { ok: false, error: "This item is no longer available and was removed." };
  }

  const nextQty = Math.min(qty, product.stock);
  const cappedAtStock = nextQty < qty;
  const items = cart.items.map((item) =>
    item.id === productId ? { ...item, qty: nextQty } : item,
  );
  await writeCartCookie({ v: cart.v, items });
  revalidatePath("/", "layout");
  return { ok: true, count: sumQty(items), cappedAtStock };
}

/** Remove a product from the cart entirely. */
export async function removeCartItemAction(productId: unknown): Promise<CartActionResult> {
  if (typeof productId !== "string" || !productId) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const cart = await readCartCookie();
  const items = cart.items.filter((item) => item.id !== productId);
  await writeCartCookie({ v: cart.v, items });
  revalidatePath("/", "layout");
  return { ok: true, count: sumQty(items), cappedAtStock: false };
}
