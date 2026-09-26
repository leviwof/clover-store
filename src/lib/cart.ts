import { cookies } from "next/headers";
import { getProductsByIds, type ProductWithCategory } from "@/db/queries";
import { SAMPLE_PRODUCTS } from "@/db/sample-catalog";

// The cart lives entirely in an httpOnly cookie holding only {id, qty} references.
// Price, name and stock are never stored here — the server re-derives them from the
// DB (or the sample catalog) on every read, so pricing and availability are always
// authoritative and the client can never influence them. These functions touch
// `cookies()` from next/headers, so this module is server-only by construction.

export const CART_COOKIE = "clover_cart";
const CART_VERSION = 1;
const MAX_LINES = 50; // distinct products, keeps us well under the 4 KB cookie limit
const MAX_QTY = 99; // per-line ceiling before the live stock clamp
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // ~30 days

export type CartCookieItem = { id: string; qty: number };
export type CartCookie = { v: number; items: CartCookieItem[] };

/** A resolved line: the authoritative product plus its stock-clamped quantity. */
export type CartLine = {
  product: ProductWithCategory;
  qty: number;
  lineCents: number;
  clamped: boolean; // qty was reduced from what the cookie asked for
};

/** The fully resolved cart, priced and clamped against live stock. */
export type ResolvedCart = {
  lines: CartLine[];
  subtotalCents: number;
  count: number;
  currency: string;
  reduced: boolean; // at least one surviving line's qty was clamped down to live stock
  removed: boolean; // at least one line was dropped (product gone/inactive/sold out)
};

function emptyCart(): CartCookie {
  return { v: CART_VERSION, items: [] };
}

/**
 * Parse a raw cookie value into a validated cart. Coerces and bounds every entry,
 * drops malformed/duplicate items, and caps the line count. Any garbage yields an
 * empty cart (fail closed) — never a throw.
 */
export function parseCart(raw: string | undefined | null): CartCookie {
  if (!raw) return emptyCart();
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) {
      return emptyCart();
    }
    const seen = new Set<string>();
    const items: CartCookieItem[] = [];
    for (const entry of (data as { items: unknown[] }).items) {
      if (!entry || typeof entry !== "object") continue;
      const id = (entry as { id?: unknown }).id;
      const rawQty = Number((entry as { qty?: unknown }).qty);
      if (typeof id !== "string" || !id || seen.has(id)) continue;
      if (!Number.isFinite(rawQty)) continue;
      const qty = Math.min(Math.max(Math.trunc(rawQty), 1), MAX_QTY);
      seen.add(id);
      items.push({ id, qty });
      if (items.length >= MAX_LINES) break;
    }
    return { v: CART_VERSION, items };
  } catch {
    return emptyCart();
  }
}

/** Read and validate the cart cookie. Fail-closed to an empty cart on any error. */
export async function readCartCookie(): Promise<CartCookie> {
  try {
    const store = await cookies();
    return parseCart(store.get(CART_COOKIE)?.value);
  } catch {
    return emptyCart();
  }
}

/**
 * Write the cart cookie. Set/delete only work inside a server action or route
 * handler (a Next.js requirement), so call this only from cart-actions.ts. An empty
 * cart deletes the cookie rather than storing `[]`.
 */
export async function writeCartCookie(cart: CartCookie): Promise<void> {
  const store = await cookies();
  const items = cart.items.slice(0, MAX_LINES);
  if (items.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify({ v: CART_VERSION, items }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Cheap header badge count — sums cookie quantities without hitting the DB. This is
 * approximate (it can't know about stock that dropped after an add); the /cart page
 * self-heals the number via resolveCart().
 */
export async function cartCount(cart?: CartCookie): Promise<number> {
  const c = cart ?? (await readCartCookie());
  return c.items.reduce((total, item) => total + item.qty, 0);
}

/**
 * Resolve product references to authoritative rows, with the storefront's
 * DB → sample-catalog fallback so the cart works even with no reachable DB.
 */
export async function lookupProducts(ids: string[]): Promise<ProductWithCategory[]> {
  if (ids.length === 0) return [];
  try {
    return await getProductsByIds(ids);
  } catch (err) {
    console.warn(
      "[clover] Database unreachable — resolving the cart against the sample catalog.\n" +
        (err instanceof Error ? `  ${err.message}` : String(err)),
    );
    const wanted = new Set(ids);
    return SAMPLE_PRODUCTS.filter((p) => wanted.has(p.id) && p.active);
  }
}

/**
 * Authoritative read of the cart: re-fetches live rows, drops items whose product is
 * gone/inactive/out of stock, clamps every line's quantity to current stock, and
 * computes all pricing from DB `priceCents`. This is the real stock guard for the
 * /cart display and subtotal — even a tampered cookie can't exceed availability.
 *
 * Resolved line order follows the cookie's insertion order (we iterate `c.items`, not the DB result).
 */
export async function resolveCart(cart?: CartCookie): Promise<ResolvedCart> {
  const c = cart ?? (await readCartCookie());
  const products = await lookupProducts(c.items.map((item) => item.id));
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: CartLine[] = [];
  let reduced = false; // a surviving line's qty was clamped down to live stock
  let removed = false; // a line was dropped (gone, inactive or sold out)
  for (const item of c.items) {
    const product = byId.get(item.id);
    if (!product || product.stock <= 0) {
      removed = true; // gone, inactive or sold out → dropped
      continue;
    }
    const qty = Math.min(item.qty, product.stock);
    if (qty !== item.qty) reduced = true;
    lines.push({ product, qty, lineCents: product.priceCents * qty, clamped: qty !== item.qty });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const count = lines.reduce((total, line) => total + line.qty, 0);
  const currency = lines[0]?.product.currency ?? "USD";
  return { lines, subtotalCents, count, currency, reduced, removed };
}
