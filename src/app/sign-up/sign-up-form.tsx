"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthField } from "@/components/auth-field";
import {
  validateName,
  validateEmail,
  validateNewPassword,
  MIN_PASSWORD_LENGTH,
} from "@/lib/validation";

// Only follow same-origin, absolute-path redirects — never an external URL or
// protocol-relative "//host" — so the ?redirect param can't be an open redirect.
function safeRedirect(target: string | undefined): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return "/account";
}

type Errors = { name?: string; email?: string; password?: string };

const CHECKS = {
  name: validateName,
  email: validateEmail,
  password: validateNewPassword,
} as const;

export function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function fieldErrors(): Errors {
    return {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validateNewPassword(password) ?? undefined,
    };
  }

  // Re-validate a single field on blur, or live once it already has an error.
  function revalidate(field: keyof Errors, value: string) {
    setErrors((prev) => ({ ...prev, [field]: CHECKS[field](value) ?? undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const next = fieldErrors();
    setErrors(next);
    const firstInvalid = next.name
      ? "name"
      : next.email
        ? "email"
        : next.password
          ? "password"
          : null;
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }

    setPending(true);
    // `role` is a server-only field (input: false) — it can't be sent here, so
    // every new account is created as "customer".
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (error) {
      setFormError(
        error.message ?? "Could not create your account. Please try again.",
      );
      setPending(false);
      return;
    }

    // Better Auth signs the user in on sign-up by default, so the session
    // cookie is already set — go straight to the protected destination.
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
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        autoFocus
        required
        disabled={pending}
        value={name}
        error={errors.name}
        onChange={(v) => {
          setName(v);
          if (errors.name) revalidate("name", v);
        }}
        onBlur={() => revalidate("name", name)}
      />

      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
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
        autoComplete="new-password"
        required
        disabled={pending}
        value={password}
        error={errors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
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
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
}
