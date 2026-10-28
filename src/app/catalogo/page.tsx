import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { productsByRoom, roomOrder, rooms } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Sofás, recámara y comedor para armar una cotización.",
};

export default function CatalogPage() {
  return (
    <div className="space-y-14">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.18em] text-clay uppercase">Catálogo</p>
        <h1 className="mt-2 font-serif text-5xl">Piezas para cotizar</h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          Agrega lo que te interese. En el siguiente paso puedes colocar esas
          piezas sobre una foto de tu espacio.
        </p>
      </header>
      {roomOrder.map((room) => (
        <section key={room} className="space-y-5">
          <h2 className="font-serif text-3xl">{rooms[room]}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {productsByRoom(room).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
