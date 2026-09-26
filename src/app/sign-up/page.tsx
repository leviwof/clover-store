import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Create Account — Clover Store",
  description: "Create a Clover account.",
};

export default async function SignUpPage({
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
              <p className="overline">Join Clover</p>
              <h1>Create an account</h1>
            </div>

            <SignUpForm redirectTo={redirect} />

            <p className="text-caption text-muted">
              Already have an account?{" "}
              <a
                className="link"
                href={
                  redirect
                    ? `/sign-in?redirect=${encodeURIComponent(redirect)}`
                    : "/sign-in"
                }
              >
                Sign in
              </a>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
