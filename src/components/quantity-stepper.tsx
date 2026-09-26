"use client";

// Shared square −/＋ stepper used by the PDP add-to-cart form and each cart line.
// Purely presentational: bounds are UX only — the server clamp is the real guard.

type Props = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  disabled = false,
  onChange,
  label = "Quantity",
}: Props) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div className="qty-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || atMin}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="qty-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
