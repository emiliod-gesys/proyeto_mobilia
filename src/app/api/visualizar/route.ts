import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText } from "ai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getProduct } from "@/lib/products";

export const maxDuration = 120;

const MODEL_ID = "gemini-nano-banana-2.1";
const samples = {
  sala: "sala-ejemplo.jpg",
  recamara: "recamara-ejemplo.jpg",
} as const;

type SampleId = keyof typeof samples;

type VisualizeBody = {
  productIds?: unknown;
  sampleId?: unknown;
  roomImage?: unknown;
  guided?: unknown;
};

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: "Falta configurar GOOGLE_GENERATIVE_AI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let body: VisualizeBody;
  try {
    body = (await request.json()) as VisualizeBody;
  } catch {
    return Response.json({ error: "La solicitud no es válida." }, { status: 400 });
  }

  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string")
    : [];
  const uniqueIds = [...new Set(productIds)].slice(0, 2);
  const selected = uniqueIds.flatMap((id) => {
    const product = getProduct(id);
    return product ? [product] : [];
  });

  if (selected.length === 0) {
    return Response.json(
      { error: "Elige una pieza del catálogo para colocarla en la foto." },
      { status: 400 },
    );
  }

  let room: { mediaType: string; data: Buffer };
  try {
    room = await readRoom(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo leer la foto.";
    return Response.json({ error: message }, { status: 400 });
  }

  const productFiles = await Promise.all(
    selected.map(async (product) => {
      const filePath = path.join(process.cwd(), "public", product.image);
      return {
        product,
        data: await readFile(filePath),
      };
    }),
  );

  const guided = body.guided === true;
  const instructions = [
    ...(guided
      ? [
          "The first photograph includes colored measurement guides. They are instructions, not physical objects.",
          "The yellow quadrilateral is a floor rectangle. Its labels are that rectangle's real size in centimeters, and edge 1–2 is the edge closest to the camera.",
          "Each other colored outline is one product's footprint at its real size. The vertical line is that product's height.",
          "Place each product strictly inside its own outline, with the same perspective, then erase every guide, dot, and text label.",
        ]
      : [
          "Edit the first photograph. It is the customer's real room and must stay recognizable.",
          "Place only the furniture described below, using the later images as visual references.",
          "Use the stated centimeter sizes as the intended real size, keeping each piece plausible in the room.",
        ]),
    "Preserve architecture, windows, walls, floor, camera angle, and lighting.",
    "Match perspective, contact shadows, and color temperature.",
    "Do not paste the product photo's background, text, logos, or extra furniture.",
    "Return one photorealistic photograph of the same room with those products installed.",
    "",
    ...productFiles.map((item, index) => {
      const round = item.product.roundTop
        ? " Its footprint is the round top; chairs stay outside it."
        : "";
      const fit = guided
        ? " Fit it inside the matching colored outline and vertical height line."
        : "";
      return `Reference image ${index + 2}: ${item.product.name}. Place ${item.product.placement}. Real size: ${item.product.widthCm} cm wide, ${item.product.depthCm} cm deep, ${item.product.heightCm} cm high.${round}${fit}`;
    }),
  ].join("\n");

  try {
    const result = await generateText({
      model: google(MODEL_ID),
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { imageSize: "1K" },
        } satisfies GoogleLanguageModelOptions,
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instructions },
            { type: "file", data: room.data, mediaType: room.mediaType },
            ...productFiles.map((item) => ({
              type: "file" as const,
              data: item.data,
              mediaType: "image/jpeg",
            })),
          ],
        },
      ],
    });

    const image = result.files.find((file) =>
      file.mediaType.startsWith("image/"),
    );
    if (!image) {
      return Response.json(
        {
          error:
            "El modelo no devolvió una imagen. Prueba con una sola pieza o con otra foto.",
        },
        { status: 502 },
      );
    }

    return Response.json({
      image: `data:${image.mediaType};base64,${image.base64}`,
      note: result.text.trim(),
    });
  } catch (error) {
    console.error(
      "visualizar",
      error instanceof Error ? error.message : "error desconocido",
    );
    return Response.json({ error: publicError(error) }, { status: 502 });
  }
}

async function readRoom(body: VisualizeBody) {
  if (body.guided === true) {
    if (typeof body.roomImage !== "string") {
      throw new Error("La generación avanzada necesita la foto con las guías.");
    }
    return decodeRoom(body.roomImage);
  }

  if (typeof body.sampleId === "string" && body.sampleId in samples) {
    const fileName = samples[body.sampleId as SampleId];
    const data = await readFile(
      path.join(process.cwd(), "public", "espacios", fileName),
    );
    return { mediaType: "image/jpeg", data };
  }

  if (typeof body.roomImage !== "string") {
    throw new Error("Sube una foto o elige un espacio de ejemplo.");
  }
  return decodeRoom(body.roomImage);
}

function decodeRoom(roomImage: string) {
  if (roomImage.length > 6_000_000) {
    throw new Error("La foto es demasiado pesada. Prueba con una imagen más pequeña.");
  }

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(
    roomImage,
  );
  if (!match) {
    throw new Error("La foto debe ser JPG, PNG o WebP.");
  }

  const data = Buffer.from(match[2], "base64");
  if (data.length === 0 || data.length > 4_000_000) {
    throw new Error("La foto es demasiado pesada. Prueba con una imagen más pequeña.");
  }
  return { mediaType: match[1], data };
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/API key|API_KEY|permission|unauthenticated|401/i.test(message)) {
    return "La clave de Gemini no fue aceptada. Revisa la variable de entorno del servidor.";
  }
  if (/quota|rate|429|resource exhausted/i.test(message)) {
    return "Gemini alcanzó el límite de uso. Espera un momento e inténtalo de nuevo.";
  }
  return "No se pudo generar la vista. Intenta con otra foto o con una sola pieza.";
}
