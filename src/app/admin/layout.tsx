import { requireAdmin } from "@/lib/session";

// Guards the whole /admin/* subtree: unauthenticated → /sign-in; signed in but
// not an admin → home. NOTE: a layout guard protects rendering only. Every
// future admin server action / route handler MUST call requireAdmin() itself —
// never trust the client for mutations.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
