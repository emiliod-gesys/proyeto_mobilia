"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

export function ViewInSpace({ slug }: { slug: string }) {
  const { ensure } = useCart();
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-full px-5 py-3 text-sm ring-1 ring-line"
      onClick={() => {
        ensure(slug);
        router.push(`/visualizar?pieza=${slug}`);
      }}
    >
      Ver en mi espacio
    </button>
  );
}
