/**
 * Tipos y funciones de serialización para el Modo Laboratorio / Sandbox
 */

export type LabDimension = '3x3' | '4x4' | '5x5' | '3D' | '4D';

export interface CustomGameRules {
  dimension: LabDimension;
  winCondition: number;      // 3, 4 o 5
  gravity: boolean;          // true sólo en 2D
  limitedPieces: number;     // 0 = ilimitado, o 3, 4, 5
  misere: boolean;           // true = quien completa línea pierde
  obstacles: number;         // 0 a 5 obstáculos
  turnTimer: number;         // 0 = sin límite, 3, 5, 10, 15 segundos
  playerCount: 2 | 3;        // 2 (X vs O) o 3 (X vs O vs Y)
}

export function createDefaultCustomRules(): CustomGameRules {
  return {
    dimension: '3x3',
    winCondition: 3,
    gravity: false,
    limitedPieces: 0,
    misere: false,
    obstacles: 0,
    turnTimer: 0,
    playerCount: 2,
  };
}

/**
 * Serializa un conjunto de reglas en un código corto de Semilla compartible.
 * Ejemplo: "LAB-3x3-W3-G0-L0-M0-O2-T5-P2"
 */
export function serializeRules(rules: CustomGameRules): string {
  const g = rules.gravity ? '1' : '0';
  const m = rules.misere ? '1' : '0';
  return `LAB-${rules.dimension}-W${rules.winCondition}-G${g}-L${rules.limitedPieces}-M${m}-O${rules.obstacles}-T${rules.turnTimer}-P${rules.playerCount}`;
}

/**
 * Deserializa un código de semilla en un objeto CustomGameRules validado.
 */
export function deserializeRules(code: string): CustomGameRules | null {
  if (!code || typeof code !== 'string') return null;
  const parts = code.trim().toUpperCase().split('-');

  if (parts.length !== 9 || parts[0] !== 'LAB') {
    return null;
  }

  const rawDim = parts[1];
  let dimension: LabDimension | null = null;
  if (rawDim === '3X3') dimension = '3x3';
  else if (rawDim === '4X4') dimension = '4x4';
  else if (rawDim === '5X5') dimension = '5x5';
  else if (rawDim === '3D') dimension = '3D';
  else if (rawDim === '4D') dimension = '4D';
  if (!dimension) return null;

  const winMatch = parts[2].match(/^W([3-5])$/);
  if (!winMatch) return null;
  const winCondition = parseInt(winMatch[1], 10);

  const gravMatch = parts[3].match(/^G([01])$/);
  if (!gravMatch) return null;
  const gravity = gravMatch[1] === '1' && (dimension === '3x3' || dimension === '4x4' || dimension === '5x5');

  const limMatch = parts[4].match(/^L([0-5])$/);
  if (!limMatch) return null;
  const limitedPieces = parseInt(limMatch[1], 10);

  const misMatch = parts[5].match(/^M([01])$/);
  if (!misMatch) return null;
  const misere = misMatch[1] === '1';

  const obsMatch = parts[6].match(/^O([0-5])$/);
  if (!obsMatch) return null;
  const obstacles = parseInt(obsMatch[1], 10);

  const timeMatch = parts[7].match(/^T(\d+)$/);
  if (!timeMatch) return null;
  const turnTimer = parseInt(timeMatch[1], 10);

  const plyMatch = parts[8].match(/^P([23])$/);
  if (!plyMatch) return null;
  const playerCount = parseInt(plyMatch[1], 10) as 2 | 3;

  return {
    dimension,
    winCondition,
    gravity,
    limitedPieces,
    misere,
    obstacles,
    turnTimer,
    playerCount,
  };
}
