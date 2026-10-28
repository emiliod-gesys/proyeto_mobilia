"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

export function AddToCart({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className={`rounded-full bg-clay font-medium text-white transition-colors hover:bg-clay-deep ${
        compact ? "px-3 py-2 text-xs" : "px-5 py-3 text-sm"
      }`}
      onClick={() => {
        add(slug);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? "Agregado" : compact ? "Agregar" : "Agregar a la cotización"}
    </button>
  );
}
