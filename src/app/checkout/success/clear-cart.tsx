"use client";

import { useEffect, useRef } from "react";
import { clearCartAction } from "@/lib/checkout-actions";

// The cart cookie can't be cleared during render (cookies() is read-only there),
// so once a paid confirmation renders we clear it from an effect via a server
// action. Guarded by a ref so React 18/19 double-invoke in dev fires it once.
export function ClearCart() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void clearCartAction().catch(() => {});
  }, []);
  return null;
}
