// Shared storefront header: slim announcement bar, sticky uppercase nav, and a
// hairline rule. Rendered on every customer-facing page so the chrome stays
// consistent. Nav anchors are root-relative (`/#…`) so they resolve to the
// homepage sections from any route.
//
// Session-aware: reads the current session on the server so the right-hand nav
// shows "Sign in" when logged out, or "Account" + "Sign out" (and an "Admin"
// link for admins) when logged in. Reading the session uses `headers()`, which
// opts pages that render this header into per-request rendering.
import { getCurrentSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const data = await getCurrentSession();
  const user = data?.user ?? null;
  const isAdmin = user?.role === "admin";

  return (
    <>
      <div className="announcement">Complimentary shipping &amp; returns on every order</div>

      {/* Header — thin, uppercase, hairline-separated, sticky */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur">
        <div className="container-luxe flex items-center justify-between py-5">
          <nav className="hidden gap-8 md:flex">
            <a className="nav-link" href="/#collections">Collections</a>
            <a className="nav-link" href="/arrivals">New In</a>
            <a className="nav-link" href="/#categories">Shop</a>
          </nav>
          <a href="/" className="font-display text-xl uppercase tracking-[0.35em]">Clover</a>
          <div className="hidden items-center gap-8 md:flex">
            <a className="nav-link" href="#">Search</a>
            {user ? (
              <>
                {isAdmin && <a className="nav-link" href="/admin">Admin</a>}
                <a className="nav-link" href="/account">Account</a>
                <SignOutButton />
              </>
            ) : (
              <a className="nav-link" href="/sign-in">Sign in</a>
            )}
            <a className="nav-link" href="#">Bag (0)</a>
          </div>
        </div>
        <hr className="hairline" />
      </header>
    </>
  );
}
