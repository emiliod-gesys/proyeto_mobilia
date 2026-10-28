import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

const steps = [
  {
    number: "01",
    title: "Elige piezas",
    text: "Arma una cotización con sofás, mesas, sillas o la cama.",
  },
  {
    number: "02",
    title: "Sube tu espacio",
    text: "Usa una foto de tu sala o recámara, o prueba con un ejemplo.",
  },
  {
    number: "03",
    title: "Mira la propuesta",
    text: "La IA coloca las piezas de tu carrito dentro de esa foto.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <p className="text-xs tracking-[0.2em] text-clay uppercase">
            Muebles para el hogar
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
            Mira el mueble dentro de tu casa.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted">
            Proyecto Mobilia arma una cotización y, con una foto de tu sala o
            recámara, muestra cómo se verían las piezas que elegiste.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper"
            >
              Ver el catálogo
            </Link>
            <Link
              href="/visualizar"
              className="rounded-full bg-card px-5 py-3 text-sm ring-1 ring-line"
            >
              Probar con una foto
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] border border-line">
            <Image
              src="/espacios/sala-ejemplo.jpg"
              alt="Sala de ejemplo lista para probar una pieza"
              width={1600}
              height={1000}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-6 hidden w-40 overflow-hidden rounded-2xl border-4 border-paper shadow-lg sm:block">
            <Image
              src="/muebles/sofa-selva.jpg"
              alt="Sofá terciopelo Selva"
              width={600}
              height={750}
              className="aspect-[4/5] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <article key={step.number} className="rounded-3xl bg-card p-6 ring-1 ring-line">
            <p className="font-serif text-3xl text-clay">{step.number}</p>
            <h2 className="mt-3 font-serif text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-4xl">Piezas para empezar</h2>
            <p className="mt-2 text-muted">Ocho muebles de muestra, con precio estimado.</p>
          </div>
          <Link href="/catalogo" className="text-sm underline-offset-4 hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
