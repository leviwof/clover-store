"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Tiny client control that clears the session and returns to the homepage.
// `router.refresh()` re-renders the server components (e.g. the session-aware
// header) so the signed-out state shows immediately. Reused by the header nav
// and the account page — pass `className` to restyle for each context.
export function SignOutButton({
  className = "nav-link cursor-pointer",
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      // Fail-soft: re-enable the control so the user can retry.
      setPending(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleSignOut} disabled={pending}>
      {pending ? "Signing out…" : label}
    </button>
  );
}
