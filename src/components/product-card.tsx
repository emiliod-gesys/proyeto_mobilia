import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { formatPrice } from "@/lib/format";
import { rooms, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-card">
      <Link href={`/producto/${product.slug}`} className="relative aspect-[4/5] bg-sand">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">
            {rooms[product.room]}
          </p>
          <h3 className="mt-1 font-serif text-2xl leading-tight">
            <Link href={`/producto/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        <p className="text-sm leading-6 text-muted">{product.blurb}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="font-medium">{formatPrice(product.price)}</p>
          <AddToCart slug={product.slug} compact />
        </div>
      </div>
    </article>
  );
}
