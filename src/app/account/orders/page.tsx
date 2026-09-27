import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getOrdersByUser, type OrderWithItems } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your Orders — Clover Store",
};

// Human-readable labels for the plain-text order statuses. Abandoned orders
// (pending/cancelled/failed) are hidden below; the rest map to a shopper label.
const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  fulfilled: "Fulfilled",
  needs_attention: "Processing",
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(value),
  );

export default async function OrdersPage() {
  // Guard independently of the layout so this page is safe on its own.
  const { user } = await requireUser("/account/orders");

  let orders: OrderWithItems[] = [];
  try {
    orders = await getOrdersByUser(user.id);
  } catch (err) {
    console.error("[clover] failed to load orders:", err);
  }

  // Show only orders that reached payment; hide abandoned/expired/failed ones.
  const visible = orders.filter(
    (o) => o.status !== "pending" && o.status !== "cancelled" && o.status !== "failed",
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-h3">Order history</h2>
        <p className="text-muted">Your past orders.</p>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-start gap-5">
          <p className="text-muted">You have no orders yet.</p>
          <a href="/arrivals" className="btn btn-outline">
            Browse new arrivals
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-6">
          {visible.map((order) => (
            <li key={order.id} className="border border-line">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex flex-col gap-1">
                  <span className="overline">{formatDate(order.createdAt)}</span>
                  <span className="text-caption text-muted">Ref {order.id.slice(0, 8)}</span>
                </div>
                <span className="overline">{STATUS_LABELS[order.status] ?? order.status}</span>
              </div>

              <div>
                {order.items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-5 py-3 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <span>
                      {item.productName} &times; {item.quantity}
                    </span>
                    <span className="text-muted">
                      {formatPrice(item.lineCents, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-line px-5 py-4">
                <span className="overline">Total</span>
                <span className="text-h3">
                  {formatPrice(order.amountTotalCents, order.currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
