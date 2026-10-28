# Proyecto Mobilia

Demo para cotizar muebles del hogar y ver, con una foto de la sala o la recámara, cómo se verían las piezas de la cotización.

La vista previa usa Gemini `gemini-nano-banana-2.1` (Nano Banana 2.1), un modelo de edición de imagen que recibe la foto del espacio y las referencias de los muebles.

## Arranque local

```bash
npm install
cp .env.example .env.local
```

En `.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=tu_clave
```

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Vercel

El proyecto es una app de Next.js. Al desplegar, define `GOOGLE_GENERATIVE_AI_API_KEY` en las variables de entorno del proyecto. No subas `.env.local`.
