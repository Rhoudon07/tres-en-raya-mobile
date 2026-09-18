import { Vector4i } from './board';

export enum PowerType {
  Bomb = 'Bomb',             // 💥 Destruye cualquier ficha en el tablero
  DoubleTurn = 'DoubleTurn', // 🔄 Permite colocar 2 fichas consecutivas
  BlockCell = 'BlockCell',   // 🪨 Convierte una casilla vacía en obstáculo '#'
  Swap = 'Swap',             // 🔀 Intercambia de posición 2 fichas del tablero
}

export interface PlayerPowers {
  bombUsed: boolean;
  doubleTurnUsed: boolean;
  blockCellUsed: boolean;
  swapUsed: boolean;
  hasUsedPower: boolean;
  usedPower: PowerType | null;
}

export function createInitialPlayerPowers(): PlayerPowers {
  return {
    bombUsed: false,
    doubleTurnUsed: false,
    blockCellUsed: false,
    swapUsed: false,
    hasUsedPower: false,
    usedPower: null,
  };
}

export function markPlayerPowerUsed(p: PlayerPowers, power: PowerType): PlayerPowers {
  return {
    bombUsed: true,
    doubleTurnUsed: true,
    blockCellUsed: true,
    swapUsed: true,
    hasUsedPower: true,
    usedPower: power,
  };
}

export interface PowerActionInfo {
  power: PowerType;
  firstTarget?: Vector4i;
}
