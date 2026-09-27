import { pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Core Better Auth tables (auth integration only).
// Regenerate/extend with: `npx @better-auth/cli generate`.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Authorization role. "customer" (default) or "admin". Declared as a
  // server-only Better Auth additional field (input: false) so it can never be
  // set through the public sign-up API — the first admin is promoted by hand.
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------------------------------------------------------------------
// Commerce catalog (v1: products, categories, stock only). Money is stored as
// integer cents to avoid floating-point rounding; format for display in the UI.
// ---------------------------------------------------------------------------

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  imageUrl: text("image_url").notNull(),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One category has many products; each product belongs to at most one category.
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// ---------------------------------------------------------------------------
// Orders (checkout phase). An order is created "pending" when a Stripe Checkout
// Session is opened, then flipped to "paid" exactly once by the payment webhook
// (with the /checkout/success page as an idempotent fallback). Money is integer
// cents; every line snapshots the name + unit price at purchase time so a past
// order never shifts if a product's price/name changes or the product is later
// removed. `status` mirrors the `role` column's plain-text style (no pg enum).
//   status: pending | paid | fulfilled | cancelled | failed | needs_attention
// ---------------------------------------------------------------------------

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable + set-null so deleting a user preserves the financial record.
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"),
  currency: text("currency").notNull().default("USD"),
  subtotalCents: integer("subtotal_cents").notNull(),
  // What Stripe charged. Equals subtotal in v1 (no tax/shipping lines yet).
  amountTotalCents: integer("amount_total_cents").notNull(),
  email: text("email"),
  stripeSessionId: text("stripe_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  // Flipped false->true atomically the one time stock is decremented, so the
  // decrement runs exactly once across concurrent webhook + success-page calls.
  stockAdjusted: boolean("stock_adjusted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  // Keep the line if the product is later deleted — the snapshot stands alone.
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  productSlug: text("product_slug"),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
  lineCents: integer("line_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One order has many line items; each line belongs to one order (and optionally
// points back at the product it was bought from).
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
