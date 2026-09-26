import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Warn but don't throw at import: a missing URL surfaces as a query-time
  // error the caller can catch (the storefront falls back to a sample catalog),
  // so `next dev` still runs on a fresh checkout before the DB is configured.
  console.warn(
    "[clover] DATABASE_URL is not set — DB queries will fail until it is set in .env.",
  );
}

// A well-formed but non-resolving placeholder lets the client construct when the
// URL is absent; any real query then fails at call time rather than at import.
const sql = neon(connectionString ?? "postgresql://unset:unset@unset.invalid/unset");

export const db = drizzle(sql, { schema });
