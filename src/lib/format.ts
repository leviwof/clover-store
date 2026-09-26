/**
 * Format an integer amount of minor units (cents) as a currency string.
 * Whole amounts drop the decimals (e.g. 245000 -> "$2,450") to match the
 * storefront's editorial pricing style; fractional amounts keep two.
 */
export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
