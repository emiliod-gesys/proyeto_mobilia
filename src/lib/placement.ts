import {
  applyHomography,
  homography,
  invertHomography,
  type Point,
} from "@/lib/homography";

export type PlacedPiece = {
  name: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  roundTop?: boolean;
};

export type FloorPlacement = {
  x: number;
  y: number;
  rotation: number;
};

export type GuideOverlay = {
  color: string;
  polygon: Point[];
  lines: [Point, Point][];
  labels: { at: Point; text: string }[];
};

export const guideColors = ["#e11d48", "#2563eb"];
export const calibrationColor = "#ca8a04";

const cornerNames = [
  "delantera izquierda",
  "delantera derecha",
  "trasera derecha",
  "trasera izquierda",
] as const;

export function cornerName(index: number) {
  return cornerNames[index] ?? "esquina";
}

export function floorMapping(
  imageCorners: Point[],
  widthCm: number,
  depthCm: number,
) {
  if (imageCorners.length !== 4 || widthCm < 20 || depthCm < 20) return null;
  if (intersects(imageCorners[0], imageCorners[1], imageCorners[2], imageCorners[3])) {
    return null;
  }
  if (intersects(imageCorners[1], imageCorners[2], imageCorners[3], imageCorners[0])) {
    return null;
  }
  const floor: Point[] = [
    { x: 0, y: 0 },
    { x: widthCm, y: 0 },
    { x: widthCm, y: depthCm },
    { x: 0, y: depthCm },
  ];
  const matrix = homography(floor, imageCorners);
  if (!matrix) return null;
  const inverse = invertHomography(matrix);
  if (!inverse) return null;
  for (let index = 0; index < 4; index += 1) {
    const projected = applyHomography(matrix, floor[index]);
    if (!projected) return null;
    const error = Math.hypot(
      projected.x - imageCorners[index].x,
      projected.y - imageCorners[index].y,
    );
    if (error > 2) return null;
  }
  return { matrix, inverse };
}

export function calibrationOverlay(
  imageCorners: Point[],
  widthCm: number,
  depthCm: number,
): GuideOverlay {
  return {
    color: calibrationColor,
    polygon: imageCorners,
    lines: [],
    labels: [
      {
        at: midpoint(imageCorners[0], imageCorners[1]),
        text: `${Math.round(widthCm)} cm`,
      },
      {
        at: midpoint(imageCorners[1], imageCorners[2]),
        text: `${Math.round(depthCm)} cm`,
      },
    ],
  };
}

export function productOverlay(
  matrix: number[],
  placement: FloorPlacement,
  product: PlacedPiece,
  color: string,
): GuideOverlay | null {
  const floorPoints = product.roundTop
    ? circlePoints(placement, product.widthCm / 2)
    : rectanglePoints(placement, product.widthCm, product.depthCm);
  const imagePoints = floorPoints.map((point) => applyHomography(matrix, point));
  if (imagePoints.some((point) => point === null)) return null;
  const polygon = imagePoints as Point[];
  const lines: [Point, Point][] = [];
  const heightAnchor = product.roundTop
    ? {
        base: applyHomography(matrix, { x: placement.x, y: placement.y }),
        scale: diameterScale(matrix, placement, product.widthCm),
      }
    : backHeight(matrix, placement, product.widthCm, product.depthCm);
  if (heightAnchor?.base && heightAnchor.scale > 0) {
    const top = {
      x: heightAnchor.base.x,
      y: heightAnchor.base.y - product.heightCm * heightAnchor.scale,
    };
    lines.push([heightAnchor.base, top]);
  }
  const center = centroid(polygon);
  return {
    color,
    polygon,
    lines,
    labels: [
      {
        at: center,
        text: `${product.name} · ${product.widthCm}×${product.depthCm}×${product.heightCm} cm`,
      },
    ],
  };
}

export function imageToFloor(inverse: number[], point: Point) {
  return applyHomography(inverse, point);
}

function rectanglePoints(
  placement: FloorPlacement,
  widthCm: number,
  depthCm: number,
): Point[] {
  return [
    rotate(placement, -widthCm / 2, 0),
    rotate(placement, widthCm / 2, 0),
    rotate(placement, widthCm / 2, depthCm),
    rotate(placement, -widthCm / 2, depthCm),
  ];
}

function circlePoints(placement: FloorPlacement, radius: number) {
  return Array.from({ length: 24 }, (_, index) => {
    const angle = (index / 24) * Math.PI * 2;
    return rotate(placement, Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
}

function rotate(placement: FloorPlacement, x: number, y: number): Point {
  const radians = (placement.rotation * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: placement.x + x * cosine - y * sine,
    y: placement.y + x * sine + y * cosine,
  };
}

function backHeight(
  matrix: number[],
  placement: FloorPlacement,
  widthCm: number,
  depthCm: number,
) {
  const backLeft = applyHomography(
    matrix,
    rotate(placement, -widthCm / 2, depthCm),
  );
  const backRight = applyHomography(
    matrix,
    rotate(placement, widthCm / 2, depthCm),
  );
  if (!backLeft || !backRight || widthCm <= 0) return null;
  return {
    base: midpoint(backLeft, backRight),
    scale: Math.hypot(backRight.x - backLeft.x, backRight.y - backLeft.y) / widthCm,
  };
}

function diameterScale(
  matrix: number[],
  placement: FloorPlacement,
  widthCm: number,
) {
  const left = applyHomography(matrix, rotate(placement, -widthCm / 2, 0));
  const right = applyHomography(matrix, rotate(placement, widthCm / 2, 0));
  if (!left || !right || widthCm <= 0) return 0;
  return Math.hypot(right.x - left.x, right.y - left.y) / widthCm;
}

function midpoint(start: Point, end: Point): Point {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
}

function centroid(points: Point[]): Point {
  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: total.x / points.length, y: total.y / points.length };
}

function intersects(a: Point, b: Point, c: Point, d: Point) {
  const first = cross(a, b, c) * cross(a, b, d);
  const second = cross(c, d, a) * cross(c, d, b);
  return first < 0 && second < 0;
}

function cross(origin: Point, end: Point, point: Point) {
  return (end.x - origin.x) * (point.y - origin.y) - (end.y - origin.y) * (point.x - origin.x);
}
