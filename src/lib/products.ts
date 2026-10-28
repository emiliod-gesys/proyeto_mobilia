export const rooms = {
  sala: "Sala",
  recamara: "Recámara",
  comedor: "Comedor",
} as const;

export type RoomId = keyof typeof rooms;

export type Product = {
  slug: string;
  name: string;
  room: RoomId;
  price: number;
  blurb: string;
  details: string;
  material: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  roundTop?: boolean;
  placement: string;
  image: string;
};

export function measuresLabel(product: Product) {
  return `${product.widthCm} × ${product.depthCm} × ${product.heightCm} cm`;
}

export const products: Product[] = [
  {
    slug: "sofa-selva",
    name: "Sofá terciopelo Selva",
    room: "sala",
    price: 28900,
    blurb: "Tres plazas en terciopelo verde profundo, con patas de madera clara.",
    details:
      "Respaldo bajo y cojines sueltos. Funciona como pieza principal frente a una mesa de centro.",
    material: "Terciopelo y patas de madera",
    widthCm: 210,
    depthCm: 86,
    heightCm: 82,
    placement:
      "a three-seat teal velvet sofa with loose back cushions, cylindrical bolsters, and tapered wooden legs",
    image: "/muebles/sofa-selva.jpg",
  },
  {
    slug: "sillon-nube",
    name: "Sillón capitoné Nube",
    room: "sala",
    price: 12400,
    blurb: "Butaca crema con respaldo abotonado y patas torneadas.",
    details:
      "Una pieza ligera para el rincón de lectura o junto al sofá. El tapiz es claro y fácil de combinar.",
    material: "Tela capitoné y madera pintada",
    widthCm: 78,
    depthCm: 74,
    heightCm: 82,
    placement:
      "a cream button-tufted armchair with a rounded back and white turned wooden legs",
    image: "/muebles/sillon-nube.jpg",
  },
  {
    slug: "lampara-taller",
    name: "Lámpara de pie Taller",
    room: "sala",
    price: 4600,
    blurb: "Lámpara de metal gris con pantalla ancha y brazo ajustable.",
    details:
      "Ilumina un sillón o la esquina de la sala sin ocupar mucho piso. El acabado es mate.",
    material: "Metal pintado",
    widthCm: 45,
    depthCm: 45,
    heightCm: 160,
    placement:
      "a matte charcoal floor lamp with a large industrial dome shade and a slim curved stem",
    image: "/muebles/lampara-taller.jpg",
  },
  {
    slug: "banco-clara",
    name: "Banco de madera Clara",
    room: "sala",
    price: 3200,
    blurb: "Banco alto de madera clara, útil como apoyo o asiento extra.",
    details:
      "Estructura sencilla de cuatro patas. Se ve bien junto a una consola o al final del sofá.",
    material: "Madera de fresno",
    widthCm: 36,
    depthCm: 36,
    heightCm: 63,
    placement:
      "a pale ash wooden stool with four straight legs, a square seat, and a handle cutout",
    image: "/muebles/banco-clara.jpg",
  },
  {
    slug: "cama-alba",
    name: "Cama capitoné Alba",
    room: "recamara",
    price: 24600,
    blurb: "Cama king con cabecera alta abotonada y ropa de cama neutra.",
    details:
      "La cabecera llega a 130 cm de alto. En la vista previa se coloca la cama, no los burós de la foto.",
    material: "Tapiz capitoné y base tapizada",
    widthCm: 193,
    depthCm: 203,
    heightCm: 130,
    placement:
      "only the cream diamond-tufted wingback bed with layered gray bedding. Do not copy the nightstands, lamps, bench, or windows from the product photo",
    image: "/muebles/cama-alba.jpg",
  },
  {
    slug: "mesa-nordica",
    name: "Mesa redonda Nórdica",
    room: "comedor",
    price: 9800,
    blurb: "Mesa redonda blanca con patas de madera y sillas a juego.",
    details:
      "Para un comedor pequeño o un desayunador. La vista coloca la mesa y sus sillas blancas.",
    material: "Cubierta blanca y patas de madera",
    widthCm: 100,
    depthCm: 100,
    heightCm: 75,
    roundTop: true,
    placement:
      "a round white dining table with light wooden legs and matching white molded chairs",
    image: "/muebles/mesa-nordica.jpg",
  },
  {
    slug: "silla-negra",
    name: "Silla moldeada Negra",
    room: "comedor",
    price: 3900,
    blurb: "Silla de casco negro y patas de madera natural.",
    details:
      "Se vende por pieza. Combina con mesas claras y ocupa poco espacio visual.",
    material: "Polipropileno y madera",
    widthCm: 48,
    depthCm: 54,
    heightCm: 82,
    placement:
      "a black molded shell dining chair with a cushioned seat and four angled wooden legs",
    image: "/muebles/silla-negra.jpg",
  },
  {
    slug: "silla-antigua",
    name: "Silla de madera Antigua",
    room: "comedor",
    price: 5400,
    blurb: "Silla de madera dorada con respaldo de listones y brazos bajos.",
    details:
      "Una pieza con carácter para la cabecera de la mesa o un rincón del comedor.",
    material: "Madera maciza",
    widthCm: 58,
    depthCm: 55,
    heightCm: 104,
    placement:
      "a vintage golden-oak armchair with a slatted back, low arms, and turned front legs",
    image: "/muebles/silla-antigua.jpg",
  },
];

export const roomOrder: RoomId[] = ["sala", "recamara", "comedor"];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function productsByRoom(room: RoomId) {
  return products.filter((product) => product.room === room);
}
