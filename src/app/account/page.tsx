import type { Metadata } from "next";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your Account — Clover Store",
};

export default async function AccountPage() {
  // Guard independently of the layout so this page is safe on its own.
  const { user } = await requireUser();

  const memberSince = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(user.createdAt));

  const rows = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Account type", value: user.role === "admin" ? "Administrator" : "Customer" },
    { label: "Member since", value: memberSince },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-h3">Account details</h2>
        <p className="text-muted">Your personal information.</p>
      </div>

      <dl className="border border-line">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <dt className="overline">{row.label}</dt>
            <dd className="sm:text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
