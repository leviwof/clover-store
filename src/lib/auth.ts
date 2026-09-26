import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Email/password only for v1. Email verification stays OFF (no email
  // provider wired up); social login, password reset and 2FA are out of scope.
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Authorization role rides on the session's user object. `input: false`
      // means it cannot be set through the public sign-up API (no privilege
      // escalation); `defaultValue` mirrors the DB column default so both
      // layers agree. New sign-ups are always "customer".
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "customer",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days — persistent cookie
    updateAge: 60 * 60 * 24, // refresh the session every 24h
  },
  // Keep nextCookies() LAST: it lets server actions / route handlers set the
  // auth cookies Better Auth returns. Note: the Drizzle adapter over neon-http
  // reports transaction:false, so Better Auth logs one benign "patching
  // transaction function" warning at startup — expected, safe to ignore.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
