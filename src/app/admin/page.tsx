import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Admin — Clover Store",
};

export default async function AdminPage() {
  // Guard independently of the layout.
  const { user } = await requireAdmin();

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          <div className="flex flex-col gap-4">
            <p className="overline">Admin</p>
            <h1>Store administration</h1>
            <p className="lead">
              Products and orders management is coming next. You&apos;re signed in
              as {user.email} with admin access.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
