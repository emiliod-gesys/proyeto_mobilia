"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { getProduct } from "@/lib/products";

export function CartView() {
  const { lines, setQuantity, remove } = useCart();
  const detailed = lines.flatMap((line) => {
    const product = getProduct(line.slug);
    return product ? [{ line, product }] : [];
  });
  const total = detailed.reduce(
    (sum, item) => sum + item.product.price * item.line.quantity,
    0,
  );

  if (detailed.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-16 text-center">
        <h1 className="font-serif text-4xl">Tu cotización está vacía</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Elige piezas del catálogo. Después podrás ver cómo se verían en una
          foto de tu sala o recámara.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm text-paper"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
        {detailed.map(({ line, product }) => (
          <li key={line.slug} className="flex gap-4 p-4 sm:p-5">
            <Link
              href={`/producto/${product.slug}`}
              className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-sand"
            >
              <Image
                src={product.image}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl leading-tight">
                    <Link href={`/producto/${product.slug}`}>{product.name}</Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(product.price)} por pieza
                  </p>
                </div>
                <p className="font-medium">
                  {formatPrice(product.price * line.quantity)}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-lg"
                    aria-label={`Quitar una unidad de ${product.name}`}
                    onClick={() => setQuantity(line.slug, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-lg"
                    aria-label={`Agregar una unidad de ${product.name}`}
                    onClick={() => setQuantity(line.slug, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                  onClick={() => remove(line.slug)}
                >
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-3xl bg-olive px-6 py-6 text-paper">
        <p className="text-xs tracking-[0.18em] uppercase text-paper/70">
          Cotización estimada
        </p>
        <p className="mt-3 font-serif text-4xl">{formatPrice(total)}</p>
        <p className="mt-3 text-sm leading-6 text-paper/80">
          Precios de demostración en quetzales. El envío y la instalación
          se confirman aparte.
        </p>
        <Link
          href="/visualizar"
          className="mt-6 inline-flex w-full justify-center rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink"
        >
          Ver estas piezas en mi espacio
        </Link>
      </aside>
    </div>
  );
}
