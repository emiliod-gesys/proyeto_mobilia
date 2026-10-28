export type Point = { x: number; y: number };

/** Maps the first plane onto the second. Returns null when the points are degenerate. */
export function homography(from: Point[], to: Point[]): number[] | null {
  if (from.length !== 4 || to.length !== 4) return null;
  const source = normalize(from);
  const target = normalize(to);
  const normalized = directHomography(source.points, target.points);
  if (!normalized) return null;
  const targetInverse = invert3(target.matrix);
  if (!targetInverse) return null;
  return multiply3(multiply3(targetInverse, normalized), source.matrix);
}

export function applyHomography(matrix: number[], point: Point): Point | null {
  const weight =
    matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  if (!Number.isFinite(weight) || Math.abs(weight) < 1e-8) return null;
  const x = (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / weight;
  const y = (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / weight;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function invertHomography(matrix: number[]): number[] | null {
  return invert3(matrix);
}

function normalize(points: Point[]) {
  let centerX = 0;
  let centerY = 0;
  for (const point of points) {
    centerX += point.x;
    centerY += point.y;
  }
  centerX /= points.length;
  centerY /= points.length;
  let distance = 0;
  for (const point of points) {
    distance += Math.hypot(point.x - centerX, point.y - centerY);
  }
  distance /= points.length;
  const scale = distance < 1e-8 ? 1 : Math.SQRT2 / distance;
  return {
    points: points.map((point) => ({
      x: scale * (point.x - centerX),
      y: scale * (point.y - centerY),
    })),
    matrix: [scale, 0, -scale * centerX, 0, scale, -scale * centerY, 0, 0, 1],
  };
}

function directHomography(from: Point[], to: Point[]) {
  const rows: number[][] = [];
  for (let index = 0; index < 4; index += 1) {
    const source = from[index];
    const target = to[index];
    rows.push([
      source.x,
      source.y,
      1,
      0,
      0,
      0,
      -target.x * source.x,
      -target.x * source.y,
      -target.x,
    ]);
    rows.push([
      0,
      0,
      0,
      source.x,
      source.y,
      1,
      -target.y * source.x,
      -target.y * source.y,
      -target.y,
    ]);
  }
  return nullspace(rows);
}

function nullspace(rows: number[][]) {
  const matrix = rows.map((row) => [...row]);
  const pivots: number[] = [];
  let rowIndex = 0;
  for (let column = 0; column < 9 && rowIndex < matrix.length; column += 1) {
    let pivot = rowIndex;
    for (let candidate = rowIndex + 1; candidate < matrix.length; candidate += 1) {
      if (Math.abs(matrix[candidate][column]) > Math.abs(matrix[pivot][column])) {
        pivot = candidate;
      }
    }
    if (Math.abs(matrix[pivot][column]) < 1e-10) continue;
    [matrix[rowIndex], matrix[pivot]] = [matrix[pivot], matrix[rowIndex]];
    const divisor = matrix[rowIndex][column];
    for (let columnIndex = column; columnIndex < 9; columnIndex += 1) {
      matrix[rowIndex][columnIndex] /= divisor;
    }
    for (let other = 0; other < matrix.length; other += 1) {
      if (other === rowIndex) continue;
      const factor = matrix[other][column];
      for (let columnIndex = column; columnIndex < 9; columnIndex += 1) {
        matrix[other][columnIndex] -= factor * matrix[rowIndex][columnIndex];
      }
    }
    pivots.push(column);
    rowIndex += 1;
  }
  if (pivots.length < 8) return null;
  const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
    (column) => !pivots.includes(column),
  );
  if (free === undefined) return null;
  const solution = Array<number>(9).fill(0);
  solution[free] = 1;
  for (let index = 0; index < pivots.length; index += 1) {
    let value = 0;
    for (let column = 0; column < 9; column += 1) {
      if (column !== pivots[index]) value -= matrix[index][column] * solution[column];
    }
    solution[pivots[index]] = value;
  }
  const magnitude = Math.hypot(...solution);
  if (magnitude < 1e-10) return null;
  return solution.map((value) => value / magnitude);
}

function multiply3(left: number[], right: number[]) {
  const product = Array<number>(9).fill(0);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      product[row * 3 + column] =
        left[row * 3] * right[column] +
        left[row * 3 + 1] * right[3 + column] +
        left[row * 3 + 2] * right[6 + column];
    }
  }
  return product;
}

function invert3(matrix: number[]) {
  const determinant =
    matrix[0] * (matrix[4] * matrix[8] - matrix[5] * matrix[7]) -
    matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
    matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-10) return null;
  const adjugate = [
    matrix[4] * matrix[8] - matrix[5] * matrix[7],
    matrix[2] * matrix[7] - matrix[1] * matrix[8],
    matrix[1] * matrix[5] - matrix[2] * matrix[4],
    matrix[5] * matrix[6] - matrix[3] * matrix[8],
    matrix[0] * matrix[8] - matrix[2] * matrix[6],
    matrix[2] * matrix[3] - matrix[0] * matrix[5],
    matrix[3] * matrix[7] - matrix[4] * matrix[6],
    matrix[1] * matrix[6] - matrix[0] * matrix[7],
    matrix[0] * matrix[4] - matrix[1] * matrix[3],
  ];
  return adjugate.map((value) => value / determinant);
}
