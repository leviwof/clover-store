"use client";

import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

// Section navigation for the /account area. Client component so it can mark the
// active route with usePathname. Sentence-case (distinct from the uppercase
// storefront nav) with a left-rule active indicator.
const ITEMS = [
  { href: "/account", label: "Account details" },
  { href: "/account/orders", label: "Order history" },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-col gap-6">
      <p className="overline">Account</p>

      <ul className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block border-l-2 py-2 pl-4 transition-colors ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:border-line hover:text-ink"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>

      <hr className="hairline" />

      <SignOutButton className="cursor-pointer border-l-2 border-transparent py-2 pl-4 text-left text-muted transition-colors hover:text-ink" />
    </nav>
  );
}
