import { CellSymbol } from './board';

export enum PlayerType {
  Human = 'Human',
  CPU = 'CPU',
}

export interface Player {
  name: string;
  symbol: CellSymbol;
  type: PlayerType;
  color: string;
}
