import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Cotización",
  description: "Revisa las piezas elegidas y el total estimado.",
};

export default function CartPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.18em] text-clay uppercase">Cotización</p>
        <h1 className="mt-2 font-serif text-5xl">Tu selección</h1>
      </header>
      <CartView />
    </div>
  );
}
