"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthField } from "@/components/auth-field";
import { validateEmail, validateCurrentPassword } from "@/lib/validation";

// Only follow same-origin, absolute-path redirects — never an external URL or
// protocol-relative "//host" — so the ?redirect param can't be an open redirect.
function safeRedirect(target: string | undefined): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return "/account";
}

type Errors = { email?: string; password?: string };

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function fieldErrors(): Errors {
    return {
      email: validateEmail(email) ?? undefined,
      password: validateCurrentPassword(password) ?? undefined,
    };
  }

  // Re-validate a single field on blur, or live once it already has an error.
  function revalidate(field: keyof Errors, value: string) {
    const check = field === "email" ? validateEmail : validateCurrentPassword;
    setErrors((prev) => ({ ...prev, [field]: check(value) ?? undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const next = fieldErrors();
    setErrors(next);
    const firstInvalid = next.email ? "email" : next.password ? "password" : null;
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }

    setPending(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    if (error) {
      // Generic message — don't reveal whether the email exists.
      setFormError(error.message ?? "Invalid email or password.");
      setPending(false);
      return;
    }

    router.push(safeRedirect(redirectTo));
    router.refresh();
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      noValidate
      aria-busy={pending}
    >
      {formError && (
        <p role="alert" className="auth-error">
          {formError}
        </p>
      )}

      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
        required
        disabled={pending}
        value={email}
        error={errors.email}
        onChange={(v) => {
          setEmail(v);
          if (errors.email) revalidate("email", v);
        }}
        onBlur={() => revalidate("email", email)}
      />

      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={pending}
        value={password}
        error={errors.password}
        onChange={(v) => {
          setPassword(v);
          if (errors.password) revalidate("password", v);
        }}
        onBlur={() => revalidate("password", password)}
      />

      <button type="submit" className="btn btn-solid" disabled={pending}>
        {pending ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
