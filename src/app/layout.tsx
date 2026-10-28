import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "Proyecto Mobilia",
    template: "%s · Proyecto Mobilia",
  },
  description:
    "Cotiza muebles para el hogar y mira cómo se verían en una foto de tu sala o recámara.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${outfit.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
