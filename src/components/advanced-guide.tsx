"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import type { Point } from "@/lib/homography";
import {
  calibrationOverlay,
  cornerName,
  floorMapping,
  guideColors,
  imageToFloor,
  productOverlay,
  type FloorPlacement,
  type GuideOverlay,
} from "@/lib/placement";
import { measuresLabel, type Product } from "@/lib/products";

export type AdvancedGuideHandle = {
  issue: () => string | null;
  composite: () => Promise<string | null>;
};

type Drag =
  | { kind: "corner"; index: number }
  | null;

type Props = {
  imageSrc: string;
  products: Product[];
};

export const AdvancedGuide = forwardRef<AdvancedGuideHandle, Props>(
  function AdvancedGuide({ imageSrc, products }, ref) {
    const frameRef = useRef<HTMLDivElement>(null);
    const [natural, setNatural] = useState<{ width: number; height: number } | null>(
      null,
    );
    const [corners, setCorners] = useState<Point[]>([]);
    const [widthInput, setWidthInput] = useState("400");
    const [depthInput, setDepthInput] = useState("300");
    const [placements, setPlacements] = useState<Record<string, FloorPlacement>>({});
    const [activeSlug, setActiveSlug] = useState("");
    const [drag, setDrag] = useState<Drag>(null);

    const widthCm = Number(widthInput);
    const depthCm = Number(depthInput);
    const mapping =
      corners.length === 4 ? floorMapping(corners, widthCm, depthCm) : null;
    const active =
      products.find((product) => product.slug === activeSlug) ?? products[0];

    const overlays: GuideOverlay[] = [];
    if (corners.length === 4) {
      overlays.push(calibrationOverlay(corners, widthCm, depthCm));
    }
    if (mapping) {
      products.forEach((product, index) => {
        const placement = placements[product.slug];
        if (!placement) return;
        const overlay = productOverlay(
          mapping.matrix,
          placement,
          product,
          guideColors[index % guideColors.length],
        );
        if (overlay) overlays.push(overlay);
      });
    }

    function issue() {
      if (!natural) return "Espera a que cargue la foto.";
      if (corners.length < 4) {
        return `Marca la esquina ${cornerName(corners.length)} del piso.`;
      }
      if (!(widthCm >= 20) || !(depthCm >= 20)) {
        return "Escribe el ancho y el fondo reales de ese rectángulo, en centímetros.";
      }
      if (!mapping) {
        return "Esas esquinas no forman un piso. Sepáralas para abrir el rectángulo.";
      }
      if (products.length === 0) return "Elige al menos una pieza de la cotización.";
      const missing = products.find((product) => !placements[product.slug]);
      if (missing) return `Toca el piso para colocar ${missing.name}.`;
      return null;
    }

    const actionsRef = useRef({
      issue: () => null as string | null,
      composite: async () => null as string | null,
    });
    actionsRef.current = {
      issue,
      async composite() {
        if (issue() || !natural) return null;
        const guides = overlays.filter((overlay) => overlay.polygon.length >= 3);
        return paintGuides(imageSrc, natural.width, natural.height, guides);
      },
    };
    useImperativeHandle(
      ref,
      () => ({
        issue: () => actionsRef.current.issue(),
        composite: () => actionsRef.current.composite(),
      }),
      [],
    );

    function rememberSize(image: HTMLImageElement | null) {
      if (!image?.complete) return;
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) return;
      setNatural((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    }

    function toImage(event: PointerEvent<HTMLDivElement>) {
      const frame = frameRef.current;
      if (!frame || !natural) return null;
      const rect = frame.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((event.clientX - rect.left) / rect.width) * natural.width,
        y: ((event.clientY - rect.top) / rect.height) * natural.height,
      };
    }

    function nearestCorner(point: Point) {
      if (!natural) return null;
      const reach = natural.width * 0.035;
      let found: number | null = null;
      let best = reach;
      corners.forEach((corner, index) => {
        const distance = Math.hypot(corner.x - point.x, corner.y - point.y);
        if (distance <= best) {
          best = distance;
          found = index;
        }
      });
      return found;
    }

    function placeActive(point: Point) {
      if (!active || !mapping) return;
      const floor = imageToFloor(mapping.inverse, point);
      if (!floor) return;
      setPlacements((current) => ({
        ...current,
        [active.slug]: {
          x: floor.x,
          y: floor.y,
          rotation: current[active.slug]?.rotation ?? 0,
        },
      }));
      const next = products.find(
        (product) => product.slug !== active.slug && !placements[product.slug],
      );
      if (next) setActiveSlug(next.slug);
    }

    const missing = products.find((product) => !placements[product.slug]);
    const step =
      corners.length < 4
        ? `Esquina ${corners.length + 1} de 4: ${cornerName(corners.length)}.`
        : !mapping
          ? "Esas esquinas no forman un piso. Sepáralas para abrir el rectángulo."
          : active && !placements[active.slug]
            ? `Toca el piso donde va el frente de ${active.name}.`
            : missing
              ? `Falta colocar ${missing.name}. Elígela en la lista y toca el piso.`
              : "Puedes mover las esquinas o volver a tocar para cambiar un mueble.";

    return (
      <div className="space-y-4">
        <div
          ref={frameRef}
          role="application"
          aria-label="Foto para marcar el piso y los muebles"
          className="relative w-full cursor-crosshair touch-none overflow-hidden rounded-3xl border border-line bg-card select-none"
          style={
            natural
              ? { aspectRatio: `${natural.width} / ${natural.height}` }
              : { aspectRatio: "16 / 10" }
          }
          onPointerDown={(event) => {
            event.preventDefault();
            const point = toImage(event);
            if (!point) return;
            const corner = nearestCorner(point);
            if (corner !== null) {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag({ kind: "corner", index: corner });
              return;
            }
            if (corners.length < 4) {
              setCorners((current) => [...current, point]);
              return;
            }
            placeActive(point);
          }}
          onPointerMove={(event) => {
            if (!drag) return;
            const point = toImage(event);
            if (!point) return;
            setCorners((current) =>
              current.map((corner, index) =>
                index === drag.index ? point : corner,
              ),
            );
          }}
          onPointerUp={() => setDrag(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={rememberSize}
            src={imageSrc}
            alt="Foto del espacio con guías de medida"
            className="absolute inset-0 h-full w-full"
            draggable={false}
            onLoad={(event) => rememberSize(event.currentTarget)}
          />
          {natural ? (
            <svg
              viewBox={`0 0 ${natural.width} ${natural.height}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {overlays.map((overlay) => (
                <g key={`${overlay.color}-${overlay.labels[0]?.text ?? "guia"}`}>
                  <polygon
                    points={overlay.polygon
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill={overlay.color}
                    fillOpacity={0.16}
                    stroke={overlay.color}
                    strokeWidth={natural.width / 280}
                  />
                  {overlay.lines.map(([start, end]) => (
                    <line
                      key={`${start.x}-${start.y}-${end.y}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={overlay.color}
                      strokeWidth={natural.width / 280}
                    />
                  ))}
                  {overlay.labels.map((label) => (
                    <text
                      key={label.text}
                      x={label.at.x}
                      y={label.at.y}
                      fill={overlay.color}
                      stroke="white"
                      strokeWidth={natural.width / 180}
                      fontSize={natural.width / 42}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      style={{ paintOrder: "stroke" }}
                    >
                      {label.text}
                    </text>
                  ))}
                </g>
              ))}
              {corners.map((corner, index) => (
                <g key={index}>
                  <circle
                    cx={corner.x}
                    cy={corner.y}
                    r={natural.width * 0.016}
                    fill="white"
                    stroke="#1e1a16"
                    strokeWidth={natural.width / 400}
                  />
                  <text
                    x={corner.x}
                    y={corner.y}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={natural.width / 48}
                    fontFamily="sans-serif"
                    fill="#1e1a16"
                  >
                    {index + 1}
                  </text>
                </g>
              ))}
            </svg>
          ) : null}
        </div>

        <p className="text-sm leading-6 text-muted" aria-live="polite">
          {step} El borde 1–2 es el frente, el más cercano a la cámara.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Ancho del rectángulo
            <span className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={20}
                max={3000}
                inputMode="numeric"
                value={widthInput}
                onChange={(event) => setWidthInput(event.target.value)}
                className="w-full rounded-2xl border border-line bg-card px-3 py-2"
              />
              cm
            </span>
          </label>
          <label className="text-sm">
            Fondo del rectángulo
            <span className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={20}
                max={3000}
                inputMode="numeric"
                value={depthInput}
                onChange={(event) => setDepthInput(event.target.value)}
                className="w-full rounded-2xl border border-line bg-card px-3 py-2"
              />
              cm
            </span>
          </label>
        </div>
        <button
          type="button"
          className="text-sm text-muted underline-offset-4 hover:underline"
          onClick={() => {
            setCorners([]);
            setPlacements({});
          }}
        >
          Borrar las esquinas
        </button>

        {products.length > 0 ? (
          <ul className="space-y-3">
            {products.map((product, index) => {
              const placement = placements[product.slug];
              const selectedPiece = active?.slug === product.slug;
              return (
                <li
                  key={product.slug}
                  className={`rounded-2xl border p-3 ${
                    selectedPiece ? "border-clay bg-white" : "border-line bg-card"
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setActiveSlug(product.slug)}
                  >
                    <span>
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: guideColors[index % guideColors.length] }}
                      />
                      {product.name}
                      <span className="mt-1 block text-sm text-muted">
                        {measuresLabel(product)}
                        {placement ? "" : " · sin colocar"}
                      </span>
                    </span>
                  </button>
                  {placement ? (
                    <label className="mt-3 block text-sm text-muted">
                      Giro: {placement.rotation}°
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={placement.rotation}
                        onChange={(event) => {
                          const rotation = Number(event.target.value);
                          setPlacements((current) => ({
                            ...current,
                            [product.slug]: { ...placement, rotation },
                          }));
                        }}
                        className="mt-1 w-full"
                      />
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Elige piezas en la cotización para marcar dónde va cada una.
          </p>
        )}
      </div>
    );
  },
);

async function paintGuides(
  imageSrc: string,
  width: number,
  height: number,
  overlays: GuideOverlay[],
) {
  const image = await loadImage(imageSrc);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.drawImage(image, 0, 0, width, height);
  const stroke = Math.max(3, width / 280);
  for (const overlay of overlays) {
    context.beginPath();
    overlay.polygon.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.globalAlpha = 0.18;
    context.fillStyle = overlay.color;
    context.fill();
    context.globalAlpha = 1;
    context.lineWidth = stroke;
    context.strokeStyle = overlay.color;
    context.stroke();
    for (const [start, end] of overlay.lines) {
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    context.font = `600 ${Math.round(width / 42)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = Math.max(3, width / 180);
    context.lineJoin = "round";
    context.strokeStyle = "white";
    context.fillStyle = overlay.color;
    for (const label of overlay.labels) {
      context.strokeText(label.text, label.at.x, label.at.y);
      context.fillText(label.text, label.at.x, label.at.y);
    }
  }
  return canvas.toDataURL("image/jpeg", 0.86);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la foto"));
    image.src = src;
  });
}
