import { BoardType, Vector4i } from './board';

export interface PuzzleDef {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  boardType: BoardType;
  playerSymbol: 'X' | 'O';
  initialMoves: { pos: Vector4i; symbol: 'X' | 'O' }[];
  targetMove: Vector4i;
  explanation: string;
  obstacles?: Vector4i[];
}
