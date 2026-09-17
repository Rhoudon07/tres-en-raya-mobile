import { BoardType, Vector4i } from '../../types/board';

/**
 * Generador y cache de líneas ganadoras para todas las modalidades.
 * Reproduce exactamente la matemática del proyecto original en C++.
 */

// 1. Líneas 3x3 Clásico (8 líneas)
function generateWinningLines3x3(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  // 3 Filas
  for (let r = 0; r < 3; ++r) {
    lines.push([
      { x: r, y: 0, z: 0, w: 0 },
      { x: r, y: 1, z: 0, w: 0 },
      { x: r, y: 2, z: 0, w: 0 },
    ]);
  }

  // 3 Columnas
  for (let c = 0; c < 3; ++c) {
    lines.push([
      { x: 0, y: c, z: 0, w: 0 },
      { x: 1, y: c, z: 0, w: 0 },
      { x: 2, y: c, z: 0, w: 0 },
    ]);
  }

  // 2 Diagonales
  lines.push([
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 1, y: 1, z: 0, w: 0 },
    { x: 2, y: 2, z: 0, w: 0 },
  ]);
  lines.push([
    { x: 0, y: 2, z: 0, w: 0 },
    { x: 1, y: 1, z: 0, w: 0 },
    { x: 2, y: 0, z: 0, w: 0 },
  ]);

  return lines;
}

// 2. Líneas 4x4 Libre y Gravedad (10 líneas)
function generateWinningLines4x4(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  // 4 Filas
  for (let r = 0; r < 4; ++r) {
    lines.push([
      { x: r, y: 0, z: 0, w: 0 },
      { x: r, y: 1, z: 0, w: 0 },
      { x: r, y: 2, z: 0, w: 0 },
      { x: r, y: 3, z: 0, w: 0 },
    ]);
  }

  // 4 Columnas
  for (let c = 0; c < 4; ++c) {
    lines.push([
      { x: 0, y: c, z: 0, w: 0 },
      { x: 1, y: c, z: 0, w: 0 },
      { x: 2, y: c, z: 0, w: 0 },
      { x: 3, y: c, z: 0, w: 0 },
    ]);
  }

  // 2 Diagonales
  lines.push([
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 1, y: 1, z: 0, w: 0 },
    { x: 2, y: 2, z: 0, w: 0 },
    { x: 3, y: 3, z: 0, w: 0 },
  ]);
  lines.push([
    { x: 0, y: 3, z: 0, w: 0 },
    { x: 1, y: 2, z: 0, w: 0 },
    { x: 2, y: 1, z: 0, w: 0 },
    { x: 3, y: 0, z: 0, w: 0 },
  ]);

  return lines;
}

// 2.1 Líneas 5x5 Libre (12 líneas)
function generateWinningLines5x5(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  // 5 Filas
  for (let r = 0; r < 5; ++r) {
    lines.push([
      { x: r, y: 0, z: 0, w: 0 },
      { x: r, y: 1, z: 0, w: 0 },
      { x: r, y: 2, z: 0, w: 0 },
      { x: r, y: 3, z: 0, w: 0 },
      { x: r, y: 4, z: 0, w: 0 },
    ]);
  }

  // 5 Columnas
  for (let c = 0; c < 5; ++c) {
    lines.push([
      { x: 0, y: c, z: 0, w: 0 },
      { x: 1, y: c, z: 0, w: 0 },
      { x: 2, y: c, z: 0, w: 0 },
      { x: 3, y: c, z: 0, w: 0 },
      { x: 4, y: c, z: 0, w: 0 },
    ]);
  }

  // 2 Diagonales
  lines.push([
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 1, y: 1, z: 0, w: 0 },
    { x: 2, y: 2, z: 0, w: 0 },
    { x: 3, y: 3, z: 0, w: 0 },
    { x: 4, y: 4, z: 0, w: 0 },
  ]);
  lines.push([
    { x: 0, y: 4, z: 0, w: 0 },
    { x: 1, y: 3, z: 0, w: 0 },
    { x: 2, y: 2, z: 0, w: 0 },
    { x: 3, y: 1, z: 0, w: 0 },
    { x: 4, y: 0, z: 0, w: 0 },
  ]);

  return lines;
}

// 3. Líneas 3x3 en 3D / Qubic (Exactamente 49 líneas)
function generateWinningLines3D(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  // 1. Filas por capa Z (9)
  for (let z = 0; z < 3; ++z) {
    for (let r = 0; r < 3; ++r) {
      lines.push([
        { x: r, y: 0, z, w: 0 },
        { x: r, y: 1, z, w: 0 },
        { x: r, y: 2, z, w: 0 },
      ]);
    }
  }

  // 2. Columnas por capa Z (9)
  for (let z = 0; z < 3; ++z) {
    for (let c = 0; c < 3; ++c) {
      lines.push([
        { x: 0, y: c, z, w: 0 },
        { x: 1, y: c, z, w: 0 },
        { x: 2, y: c, z, w: 0 },
      ]);
    }
  }

  // 3. Pilares verticales entre capas (9)
  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      lines.push([
        { x: r, y: c, z: 0, w: 0 },
        { x: r, y: c, z: 1, w: 0 },
        { x: r, y: c, z: 2, w: 0 },
      ]);
    }
  }

  // 4. Diagonales en planos XY por piso Z (6)
  for (let z = 0; z < 3; ++z) {
    lines.push([
      { x: 0, y: 0, z, w: 0 },
      { x: 1, y: 1, z, w: 0 },
      { x: 2, y: 2, z, w: 0 },
    ]);
    lines.push([
      { x: 0, y: 2, z, w: 0 },
      { x: 1, y: 1, z, w: 0 },
      { x: 2, y: 0, z, w: 0 },
    ]);
  }

  // 5. Diagonales en planos XZ (6)
  for (let r = 0; r < 3; ++r) {
    lines.push([
      { x: r, y: 0, z: 0, w: 0 },
      { x: r, y: 1, z: 1, w: 0 },
      { x: r, y: 2, z: 2, w: 0 },
    ]);
    lines.push([
      { x: r, y: 2, z: 0, w: 0 },
      { x: r, y: 1, z: 1, w: 0 },
      { x: r, y: 0, z: 2, w: 0 },
    ]);
  }

  // 6. Diagonales en planos YZ (6)
  for (let c = 0; c < 3; ++c) {
    lines.push([
      { x: 0, y: c, z: 0, w: 0 },
      { x: 1, y: c, z: 1, w: 0 },
      { x: 2, y: c, z: 2, w: 0 },
    ]);
    lines.push([
      { x: 0, y: c, z: 2, w: 0 },
      { x: 1, y: c, z: 1, w: 0 },
      { x: 2, y: c, z: 0, w: 0 },
    ]);
  }

  // 7. Diagonales espaciales 3D que cruzan el centro (1,1,1) (4)
  lines.push([
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 1, y: 1, z: 1, w: 0 },
    { x: 2, y: 2, z: 2, w: 0 },
  ]);
  lines.push([
    { x: 0, y: 2, z: 0, w: 0 },
    { x: 1, y: 1, z: 1, w: 0 },
    { x: 2, y: 0, z: 2, w: 0 },
  ]);
  lines.push([
    { x: 2, y: 0, z: 0, w: 0 },
    { x: 1, y: 1, z: 1, w: 0 },
    { x: 0, y: 2, z: 2, w: 0 },
  ]);
  lines.push([
    { x: 2, y: 2, z: 0, w: 0 },
    { x: 1, y: 1, z: 1, w: 0 },
    { x: 0, y: 0, z: 2, w: 0 },
  ]);

  return lines;
}

// 4. Líneas 3x3 en 4D / Teseracto (Exactamente 272 líneas)
function generateWinningLines4D(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  for (let dx = -1; dx <= 1; ++dx) {
    for (let dy = -1; dy <= 1; ++dy) {
      for (let dz = -1; dz <= 1; ++dz) {
        for (let dw = -1; dw <= 1; ++dw) {
          if (dx === 0 && dy === 0 && dz === 0 && dw === 0) continue;

          // Normalizar dirección: primer componente no nulo debe ser positivo para evitar duplicados inversos
          const firstNonZero = dx !== 0 ? dx : dy !== 0 ? dy : dz !== 0 ? dz : dw;
          if (firstNonZero <= 0) continue;

          const xStartMin = dx === 0 ? 0 : dx === 1 ? 0 : 2;
          const xStartMax = dx === 0 ? 2 : dx === 1 ? 0 : 2;

          const yStartMin = dy === 0 ? 0 : dy === 1 ? 0 : 2;
          const yStartMax = dy === 0 ? 2 : dy === 1 ? 0 : 2;

          const zStartMin = dz === 0 ? 0 : dz === 1 ? 0 : 2;
          const zStartMax = dz === 0 ? 2 : dz === 1 ? 0 : 2;

          const wStartMin = dw === 0 ? 0 : dw === 1 ? 0 : 2;
          const wStartMax = dw === 0 ? 2 : dw === 1 ? 0 : 2;

          for (let x = xStartMin; x <= xStartMax; ++x) {
            for (let y = yStartMin; y <= yStartMax; ++y) {
              for (let z = zStartMin; z <= zStartMax; ++z) {
                for (let w = wStartMin; w <= wStartMax; ++w) {
                  lines.push([
                    { x, y, z, w },
                    { x: x + dx, y: y + dy, z: z + dz, w: w + dw },
                    { x: x + 2 * dx, y: y + 2 * dy, z: z + 2 * dz, w: w + 2 * dw },
                  ]);
                }
              }
            }
          }
        }
      }
    }
  }

  return lines;
}

// 5. Líneas 4x4 en 3D / Qubic 4x4x4 (Exactamente 76 líneas)
function generateWinningLines4x4_3D(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  // 1. Filas por capa Z (16)
  for (let z = 0; z < 4; ++z) {
    for (let r = 0; r < 4; ++r) {
      lines.push([
        { x: r, y: 0, z, w: 0 },
        { x: r, y: 1, z, w: 0 },
        { x: r, y: 2, z, w: 0 },
        { x: r, y: 3, z, w: 0 },
      ]);
    }
  }

  // 2. Columnas por capa Z (16)
  for (let z = 0; z < 4; ++z) {
    for (let c = 0; c < 4; ++c) {
      lines.push([
        { x: 0, y: c, z, w: 0 },
        { x: 1, y: c, z, w: 0 },
        { x: 2, y: c, z, w: 0 },
        { x: 3, y: c, z, w: 0 },
      ]);
    }
  }

  // 3. Pilares verticales entre capas Z (16)
  for (let r = 0; r < 4; ++r) {
    for (let c = 0; c < 4; ++c) {
      lines.push([
        { x: r, y: c, z: 0, w: 0 },
        { x: r, y: c, z: 1, w: 0 },
        { x: r, y: c, z: 2, w: 0 },
        { x: r, y: c, z: 3, w: 0 },
      ]);
    }
  }

  // 4. Diagonales en planos XY por piso Z (8)
  for (let z = 0; z < 4; ++z) {
    lines.push([
      { x: 0, y: 0, z, w: 0 },
      { x: 1, y: 1, z, w: 0 },
      { x: 2, y: 2, z, w: 0 },
      { x: 3, y: 3, z, w: 0 },
    ]);
    lines.push([
      { x: 0, y: 3, z, w: 0 },
      { x: 1, y: 2, z, w: 0 },
      { x: 2, y: 1, z, w: 0 },
      { x: 3, y: 0, z, w: 0 },
    ]);
  }

  // 5. Diagonales en planos XZ (8)
  for (let c = 0; c < 4; ++c) {
    lines.push([
      { x: 0, y: c, z: 0, w: 0 },
      { x: 1, y: c, z: 1, w: 0 },
      { x: 2, y: c, z: 2, w: 0 },
      { x: 3, y: c, z: 3, w: 0 },
    ]);
    lines.push([
      { x: 3, y: c, z: 0, w: 0 },
      { x: 2, y: c, z: 1, w: 0 },
      { x: 1, y: c, z: 2, w: 0 },
      { x: 0, y: c, z: 3, w: 0 },
    ]);
  }

  // 6. Diagonales en planos YZ (8)
  for (let r = 0; r < 4; ++r) {
    lines.push([
      { x: r, y: 0, z: 0, w: 0 },
      { x: r, y: 1, z: 1, w: 0 },
      { x: r, y: 2, z: 2, w: 0 },
      { x: r, y: 3, z: 3, w: 0 },
    ]);
    lines.push([
      { x: r, y: 3, z: 0, w: 0 },
      { x: r, y: 2, z: 1, w: 0 },
      { x: r, y: 1, z: 2, w: 0 },
      { x: r, y: 0, z: 3, w: 0 },
    ]);
  }

  // 7. Diagonales espaciales 3D que cruzan el cubo (4)
  lines.push([
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 1, y: 1, z: 1, w: 0 },
    { x: 2, y: 2, z: 2, w: 0 },
    { x: 3, y: 3, z: 3, w: 0 },
  ]);
  lines.push([
    { x: 0, y: 3, z: 0, w: 0 },
    { x: 1, y: 2, z: 1, w: 0 },
    { x: 2, y: 1, z: 2, w: 0 },
    { x: 3, y: 0, z: 3, w: 0 },
  ]);
  lines.push([
    { x: 3, y: 0, z: 0, w: 0 },
    { x: 2, y: 1, z: 1, w: 0 },
    { x: 1, y: 2, z: 2, w: 0 },
    { x: 0, y: 3, z: 3, w: 0 },
  ]);
  lines.push([
    { x: 3, y: 3, z: 0, w: 0 },
    { x: 2, y: 2, z: 1, w: 0 },
    { x: 1, y: 1, z: 2, w: 0 },
    { x: 0, y: 0, z: 3, w: 0 },
  ]);

  return lines;
}

// 6. Líneas Macro de Ultimate Tic-Tac-Toe (8 macro-líneas que conectan 3 mini-tableros)
function generateWinningLinesUltimate(): Vector4i[][] {
  const lines: Vector4i[][] = [];

  // 3 Filas macro (w: fila macro, z: col macro)
  for (let w = 0; w < 3; ++w) {
    lines.push([
      { x: 1, y: 1, z: 0, w },
      { x: 1, y: 1, z: 1, w },
      { x: 1, y: 1, z: 2, w },
    ]);
  }

  // 3 Columnas macro
  for (let z = 0; z < 3; ++z) {
    lines.push([
      { x: 1, y: 1, z, w: 0 },
      { x: 1, y: 1, z, w: 1 },
      { x: 1, y: 1, z, w: 2 },
    ]);
  }

  // 2 Diagonales macro
  lines.push([
    { x: 1, y: 1, z: 0, w: 0 },
    { x: 1, y: 1, z: 1, w: 1 },
    { x: 1, y: 1, z: 2, w: 2 },
  ]);
  lines.push([
    { x: 1, y: 1, z: 2, w: 0 },
    { x: 1, y: 1, z: 1, w: 1 },
    { x: 1, y: 1, z: 0, w: 2 },
  ]);

  return lines;
}

export const coordToIndex = (p: Vector4i): number => p.x + p.y * 5 + p.z * 25 + p.w * 100;

// Caches estáticos inicializados perezosamente
let cached3x3: Vector4i[][] | null = null;
let cached4x4: Vector4i[][] | null = null;
let cached3D: Vector4i[][] | null = null;
let cached4D: Vector4i[][] | null = null;
let cached4x4_3D: Vector4i[][] | null = null;
let cached5x5: Vector4i[][] | null = null;
let cachedUltimate: Vector4i[][] | null = null;

const cachedIndices: Partial<Record<BoardType, number[][]>> = {};

export function getWinningLines(type: BoardType): Vector4i[][] {
  switch (type) {
    case BoardType.TicTacToe3x3:
    case BoardType.Limited3x3:
    case BoardType.Misere3x3:
    case BoardType.Movement3x3:
    case BoardType.TimeAttack3x3:
      if (!cached3x3) cached3x3 = generateWinningLines3x3();
      return cached3x3;
    case BoardType.Connect4x4:
    case BoardType.Gravity4x4:
    case BoardType.Obstacles4x4:
      if (!cached4x4) cached4x4 = generateWinningLines4x4();
      return cached4x4;
    case BoardType.Connect5x5:
      if (!cached5x5) cached5x5 = generateWinningLines5x5();
      return cached5x5;
    case BoardType.TicTacToe3D:
      if (!cached3D) cached3D = generateWinningLines3D();
      return cached3D;
    case BoardType.TicTacToe4D:
      if (!cached4D) cached4D = generateWinningLines4D();
      return cached4D;
    case BoardType.TicTacToe4x4_3D:
      if (!cached4x4_3D) cached4x4_3D = generateWinningLines4x4_3D();
      return cached4x4_3D;
    case BoardType.Ultimate:
      if (!cachedUltimate) cachedUltimate = generateWinningLinesUltimate();
      return cachedUltimate;
  }
}

export function getWinningLineIndices(type: BoardType): number[][] {
  if (!cachedIndices[type]) {
    const lines = getWinningLines(type);
    cachedIndices[type] = lines.map((line) => line.map(coordToIndex));
  }
  return cachedIndices[type]!;
}

/**
 * Cuenta cuántas líneas ganadoras cruzan por una coordenada 4D específica.
 * Útil para la telemetría en tiempo real del modo 4D.
 */
export function countWinningLinesPassingThrough(pos: Vector4i, type: BoardType = BoardType.TicTacToe4D): number {
  const lines = getWinningLines(type);
  let count = 0;
  for (const line of lines) {
    if (line.some((p) => p.x === pos.x && p.y === pos.y && p.z === pos.z && p.w === pos.w)) {
      count++;
    }
  }
  return count;
}
