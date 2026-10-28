import type { Metadata } from "next";
import { Suspense } from "react";
import { Visualizer } from "@/components/visualizer";

export const metadata: Metadata = {
  title: "Ver en mi espacio",
  description:
    "Sube una foto de tu sala o recámara y mira las piezas de tu cotización en ese espacio.",
};

export default function VisualizePage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.18em] text-clay uppercase">Vista previa</p>
        <h1 className="mt-2 font-serif text-5xl">Tu espacio, con la pieza elegida</h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          La foto de la habitación y las piezas de la cotización se envían a
          Gemini para componer una propuesta visual.
        </p>
      </header>
      <Suspense fallback={<p className="text-muted">Preparando la vista…</p>}>
        <Visualizer />
      </Suspense>
    </div>
  );
}
