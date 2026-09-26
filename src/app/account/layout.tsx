import { requireUser } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AccountNav } from "@/components/account-nav";

// Guards the whole /account/* subtree: an unauthenticated visitor is redirected
// to /sign-in before any child renders. Individual pages/actions still guard
// themselves (defense in depth), but this covers rendering for the subtree.
//
// It also owns the account shell — header, greeting, section nav, footer — so
// every account page shares one chrome and only supplies its own panel.
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          <div className="mx-auto flex max-w-4xl flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="overline">Your account</p>
              <h1>Hello, {user.name}</h1>
            </div>

            <div className="grid gap-10 md:grid-cols-[220px_1fr] md:gap-16">
              <aside>
                <AccountNav />
              </aside>
              <div className="min-w-0">{children}</div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
