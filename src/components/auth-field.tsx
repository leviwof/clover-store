"use client";

import { useId, useState } from "react";

type AuthFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** Inline validation message; when set the field renders its error state. */
  error?: string | null;
  /** Helper text shown under the field while there's no error (e.g. rules). */
  hint?: string;
  onBlur?: () => void;
};

/**
 * Bordered auth/admin input with a label, accessible inline error, optional
 * hint, and a Show/Hide toggle for password fields. Wraps the design-system
 * `.field-box` primitive so sign-in and sign-up stay visually identical.
 */
export function AuthField({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  autoFocus,
  required,
  disabled,
  error,
  hint,
  onBlur,
}: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [reveal, setReveal] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && reveal ? "text" : type;
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="overline">
        {label}
      </label>

      <div className="field-control">
        <input
          id={id}
          name={name}
          type={inputType}
          className={`field-box${isPassword ? " has-affix" : ""}`}
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />

        {isPassword && (
          <button
            type="button"
            className="field-affix"
            onClick={() => setReveal((r) => !r)}
            disabled={disabled}
            aria-pressed={reveal}
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            {reveal ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {hint && !error && (
        <span id={hintId} className="text-caption text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
