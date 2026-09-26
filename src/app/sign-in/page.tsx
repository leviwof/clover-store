import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — Clover Store",
  description: "Sign in to your Clover account.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-luxe section">
          <div className="mx-auto flex max-w-md flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="overline">Welcome back</p>
              <h1>Sign in</h1>
            </div>

            <SignInForm redirectTo={redirect} />

            <p className="text-caption text-muted">
              New to Clover?{" "}
              <a
                className="link"
                href={
                  redirect
                    ? `/sign-up?redirect=${encodeURIComponent(redirect)}`
                    : "/sign-up"
                }
              >
                Create an account
              </a>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
