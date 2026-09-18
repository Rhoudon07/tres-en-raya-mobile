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
}

export function createInitialPlayerPowers(): PlayerPowers {
  return {
    bombUsed: false,
    doubleTurnUsed: false,
    blockCellUsed: false,
    swapUsed: false,
  };
}

export interface PowerActionInfo {
  power: PowerType;
  firstTarget?: Vector4i;
}
