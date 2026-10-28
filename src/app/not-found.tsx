import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16">
      <h1 className="font-serif text-5xl">No encontramos esa página</h1>
      <p className="mt-3 text-muted">La pieza puede haber salido del catálogo de muestra.</p>
      <Link href="/catalogo" className="mt-6 inline-flex text-sm underline-offset-4 hover:underline">
        Volver al catálogo
      </Link>
    </div>
  );
}
