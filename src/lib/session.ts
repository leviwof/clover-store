import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Central session access for server components, layouts and (future) admin
// server actions. Auth has no sample-data fallback — every call hits Postgres —
// so these helpers FAIL CLOSED: a DB/query error is treated as "not signed in"
// rather than crashing the route or leaking access.

/**
 * Read the current session on the server. Returns `{ session, user } | null`.
 * Swallows query-time errors (e.g. DATABASE_URL unset/unreachable) and reports
 * them as an unauthenticated result.
 */
export async function getCurrentSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null; // DB unreachable → treat as unauthenticated (fail closed)
  }
}

/**
 * Require any signed-in user. Redirects to /sign-in (preserving where to return
 * to) when there is no session. Returns the non-null session data otherwise.
 */
export async function requireUser(returnTo = "/account") {
  const data = await getCurrentSession();
  if (!data) redirect(`/sign-in?redirect=${encodeURIComponent(returnTo)}`);
  return data;
}

/**
 * Require an admin. Redirects to /sign-in when unauthenticated, or to the home
 * page when signed in but not an admin. Returns the session data otherwise.
 * Every admin route/action must call this independently — a layout guard
 * protects rendering, not mutations.
 */
export async function requireAdmin() {
  const data = await getCurrentSession();
  if (!data) redirect("/sign-in?redirect=/admin");
  if (data.user.role !== "admin") redirect("/"); // authenticated but not admin
  return data;
}
