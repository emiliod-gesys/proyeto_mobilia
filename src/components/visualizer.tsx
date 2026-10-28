"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  AdvancedGuide,
  type AdvancedGuideHandle,
} from "@/components/advanced-guide";
import { useCart } from "@/lib/cart";
import { getProduct, measuresLabel, products, rooms } from "@/lib/products";

const samples = {
  sala: {
    label: "Sala de ejemplo",
    src: "/espacios/sala-ejemplo.jpg",
  },
  recamara: {
    label: "Recámara de ejemplo",
    src: "/espacios/recamara-ejemplo.jpg",
  },
} as const;

type SampleId = keyof typeof samples;

type RoomSource =
  | { kind: "sample"; id: SampleId }
  | { kind: "upload"; dataUrl: string };

const MAX_PIECES = 2;

export function Visualizer() {
  const params = useSearchParams();
  const pieza = params.get("pieza");
  const requested = pieza && getProduct(pieza) ? pieza : null;
  const { lines, ensure } = useCart();
  const [room, setRoom] = useState<RoomSource>({ kind: "sample", id: "sala" });
  const [trackedRequest, setTrackedRequest] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"rapida" | "avanzada">("rapida");
  const guideRef = useRef<AdvancedGuideHandle>(null);

  if (requested !== trackedRequest) {
    setTrackedRequest(requested);
    if (requested) setSelected([requested]);
  }

  const cartProducts = lines.flatMap((line) => {
    const product = getProduct(line.slug);
    return product ? [product] : [];
  });
  const requestedProduct = requested ? getProduct(requested) : undefined;
  const choosable =
    requestedProduct &&
    !cartProducts.some((product) => product.slug === requestedProduct.slug)
      ? [requestedProduct, ...cartProducts]
      : cartProducts;

  function toggle(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      if (current.length >= MAX_PIECES) {
        return [...current.slice(1), slug];
      }
      return [...current, slug];
    });
  }

  async function loadFile(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Sube una foto en JPG, PNG o WebP.");
      return;
    }
    const dataUrl = await compressImage(file);
    setRoom({ kind: "upload", dataUrl });
    setResult(null);
  }

  async function generate() {
    if (selected.length === 0) {
      setError("Elige al menos una pieza de tu cotización.");
      return;
    }
    let roomPayload: { sampleId?: SampleId; roomImage?: string; guided?: boolean };
    if (mode === "avanzada") {
      const guide = guideRef.current;
      if (!guide) {
        setError("Marca el piso en la foto antes de generar.");
        return;
      }
      const problem = guide.issue();
      if (problem) {
        setError(problem);
        return;
      }
      try {
        const composited = await guide.composite();
        if (!composited) {
          setError("No se pudo preparar la foto con las guías.");
          return;
        }
        if (composited.length > 5_500_000) {
          setError("La foto con guías quedó muy pesada. Prueba con una imagen más pequeña.");
          return;
        }
        roomPayload = { roomImage: composited, guided: true };
      } catch {
        setError("No se pudo preparar la foto con las guías.");
        return;
      }
    } else if (room.kind === "sample") {
      roomPayload = { sampleId: room.id };
    } else {
      roomPayload = { roomImage: room.dataUrl };
    }
    for (const slug of selected) ensure(slug);
    setPending(true);
    setError("");
    setNote("");
    setResult(null);
    try {
      const response = await fetch("/api/visualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selected,
          ...roomPayload,
        }),
      });
      const payload = (await response.json()) as {
        image?: string;
        note?: string;
        error?: string;
      };
      if (!response.ok || !payload.image) {
        setError(payload.error ?? "No se pudo generar la vista.");
        return;
      }
      setResult(payload.image);
      setNote(payload.note ?? "");
    } catch {
      setError("No hubo respuesta del servidor. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  const previewSrc =
    room.kind === "sample" ? samples[room.id].src : room.dataUrl;
  const selectedProducts = selected.flatMap((slug) => {
    const product = getProduct(slug);
    return product ? [product] : [];
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
        <div
          role="group"
          aria-label="Tipo de generación"
          className="flex w-fit rounded-full bg-sand p-1"
        >
          {(
            [
              ["rapida", "Rápida"],
              ["avanzada", "Avanzada"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              className={`rounded-full px-4 py-2 text-sm ${
                mode === value ? "bg-ink text-paper" : "text-ink"
              }`}
              onClick={() => {
                setMode(value);
                setError("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted">
          {mode === "rapida"
            ? "Coloca las piezas al instante, sin marcar el piso."
            : "Marca un rectángulo real del piso y el lugar de cada mueble para respetar las medidas."}
        </p>
      </div>
      <section className="space-y-4">
        {mode === "avanzada" ? (
          <AdvancedGuide
            key={previewSrc}
            ref={guideRef}
            imageSrc={previewSrc}
            products={selectedProducts}
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-line bg-card">
            {/* La foto del usuario y el resultado llegan como data URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt={
                room.kind === "sample"
                  ? samples[room.id].label
                  : "Foto de tu espacio"
              }
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(samples) as SampleId[]).map((id) => {
            const active = room.kind === "sample" && room.id === id;
            return (
              <button
                key={id}
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${
                  active ? "bg-ink text-paper" : "bg-card text-ink ring-1 ring-line"
                }`}
                onClick={() => {
                  setRoom({ kind: "sample", id });
                  setResult(null);
                }}
              >
                {samples[id].label}
              </button>
            );
          })}
          <label className="cursor-pointer rounded-full bg-card px-4 py-2 text-sm ring-1 ring-line">
            Subir mi foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadFile(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-sm leading-6 text-muted">
          Usa una foto de frente, con luz natural si puedes. La vista es una
          propuesta generada con IA, no una foto de la pieza ya instalada.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-3xl">Piezas de tu cotización</h2>
          <p className="mt-1 text-sm text-muted">
            Elige hasta {MAX_PIECES}. Si marcas una tercera, se reemplaza la
            primera.
          </p>
        </div>

        {choosable.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-card p-5">
            <p className="text-sm leading-6 text-muted">
              Todavía no hay piezas. Agrega una desde el catálogo o usa este
              atajo.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {products.slice(0, 4).map((product) => (
                <button
                  key={product.slug}
                  type="button"
                  className="overflow-hidden rounded-2xl border border-line text-left"
                  onClick={() => {
                    ensure(product.slug);
                    setSelected([product.slug]);
                  }}
                >
                  <span className="relative block aspect-[4/3] bg-sand">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </span>
                  <span className="block px-3 py-2 text-sm">{product.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {choosable.map((product) => {
              const active = selected.includes(product.slug);
              return (
                <li key={product.slug}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left ${
                      active
                        ? "border-clay bg-white"
                        : "border-line bg-card"
                    }`}
                    onClick={() => toggle(product.slug)}
                  >
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs tracking-[0.14em] text-muted uppercase">
                        {rooms[product.room]}
                      </span>
                      <span className="block truncate font-medium">
                        {product.name}
                      </span>
                      <span className="block text-sm text-muted">
                        {measuresLabel(product)}
                      </span>
                    </span>
                    <span
                      className={`ml-auto mr-2 h-4 w-4 rounded-full border ${
                        active ? "border-clay bg-clay" : "border-line"
                      }`}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-clay px-5 py-3 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60"
            disabled={pending || selected.length === 0}
            onClick={() => void generate()}
          >
            {pending ? "Generando la vista…" : "Ver cómo se vería"}
          </button>
          <Link href="/carrito" className="text-sm text-muted underline-offset-4 hover:underline">
            Revisar cotización
          </Link>
        </div>
        {pending ? (
          <p className="text-sm text-muted" role="status">
            Gemini está componiendo la foto. Puede tardar cerca de un minuto.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-clay-deep" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="lg:col-span-2">
          <h2 className="font-serif text-3xl">Así podría verse</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            {note ||
              "Propuesta visual. La escala y los materiales pueden variar respecto a la pieza real."}
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result}
              alt="Propuesta de la habitación con los muebles elegidos"
              className="w-full"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la foto");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
