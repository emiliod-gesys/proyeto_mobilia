import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/add-to-cart";
import { ViewInSpace } from "@/components/view-in-space";
import { formatPrice } from "@/lib/format";
import { getProduct, products, rooms } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Pieza no encontrada" };
  return { title: product.name, description: product.blurb };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductFallback />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <article className="grid items-start gap-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-sand">
        <Image
          src={product.image}
          alt={product.name}
          width={1400}
          height={1600}
          priority
          className="aspect-[4/5] w-full object-cover"
        />
      </div>
      <div>
        <p className="text-xs tracking-[0.18em] text-clay uppercase">
          {rooms[product.room]}
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-tight">{product.name}</h1>
        <p className="mt-4 text-2xl">{formatPrice(product.price)}</p>
        <p className="mt-4 max-w-md text-lg leading-8 text-muted">{product.details}</p>
        <dl className="mt-6 grid max-w-md grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted">Ancho</dt>
            <dd className="mt-1">{product.widthCm} cm</dd>
          </div>
          <div>
            <dt className="text-muted">Fondo</dt>
            <dd className="mt-1">{product.depthCm} cm</dd>
          </div>
          <div>
            <dt className="text-muted">Alto</dt>
            <dd className="mt-1">{product.heightCm} cm</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">
          Material: {product.material}. El ancho es el frente; el fondo es la
          profundidad.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <AddToCart slug={product.slug} />
          <ViewInSpace slug={product.slug} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Precio estimado de demostración. No incluye envío.
        </p>
      </div>
    </article>
  );
}

function ProductFallback() {
  return (
    <div className="grid gap-10 lg:grid-cols-2" aria-busy="true">
      <p className="sr-only">Cargando la pieza…</p>
      <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-sand" />
      <div className="space-y-4 pt-2">
        <div className="h-4 w-24 rounded-full bg-sand" />
        <div className="h-12 w-3/4 rounded-2xl bg-sand" />
        <div className="h-8 w-32 rounded-full bg-sand" />
      </div>
    </div>
  );
}
