"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const links = [
  { href: "/catalogo", label: "Catálogo", short: "Catálogo" },
  { href: "/visualizar", label: "Ver en mi espacio", short: "Espacio" },
  { href: "/carrito", label: "Cotización", short: "Cotización" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-serif text-2xl tracking-tight text-ink">
            Mobilia
          </span>
          <span className="hidden text-xs tracking-[0.18em] text-muted uppercase sm:inline">
            Proyecto
          </span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-2 text-sm transition-colors sm:px-3 ${
                  active ? "bg-ink text-paper" : "text-ink hover:bg-sand"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
                {link.href === "/carrito" && count > 0 ? (
                  <span className="ml-1.5 inline-flex min-w-5 justify-center rounded-full bg-clay px-1.5 text-xs text-white">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
