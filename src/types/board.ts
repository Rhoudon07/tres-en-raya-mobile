/**
 * Tipos y estructuras del tablero
 */

export type CellSymbol = 'X' | 'O' | ' ';

export enum BoardType {
  TicTacToe3x3 = 'TicTacToe3x3', // Tres en Raya clásico (3x3, 3 en línea libre)
  Connect4x4 = 'Connect4x4',     // Cuatro en Raya libre (4x4, 4 en línea libre)
  Gravity4x4 = 'Gravity4x4',     // Cuatro en Raya con gravedad (4x4, caída por columna)
  TicTacToe3D = 'TicTacToe3D',   // Tres en Raya 3x3 en 3D (3 pisos, 27 casillas)
  TicTacToe4D = 'TicTacToe4D',   // Tres en Raya 3x3 en 4D (Teseracto 3x3x3x3, 81 casillas)
}

export interface Vector2i {
  x: number; // row
  y: number; // col
}

export interface Vector3i {
  x: number; // z (layer/piso)
  y: number; // r (fila)
  z: number; // c (columna)
}

export interface Vector4i {
  x: number; // fila dentro del tablero 3x3
  y: number; // columna dentro del tablero 3x3
  z: number; // piso/capa (0..2)
  w: number; // universo/macro-matriz (0..2)
}

export function areVectorsEqual(a?: Vector4i | null, b?: Vector4i | null): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

export type Grid2D = CellSymbol[][];
export type Grid3D = CellSymbol[][][];
export type Grid4D = CellSymbol[][][][];

export type WinningLine = Vector4i[];
