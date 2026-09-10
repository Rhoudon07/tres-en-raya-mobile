import { CellSymbol, Vector4i } from './board';

export enum MoveQuality {
  Best = 'Best',             // 🎯 Mejor jugada (100%)
  Good = 'Good',             // 👍 Buena (80%)
  Inaccuracy = 'Inaccuracy', // ⚠️ Imprecisión (50%)
  Mistake = 'Mistake',       // ❌ Error táctico (25%)
  Blunder = 'Blunder',       // 💀 Pifia grave (0%)
}

export interface MoveRecord {
  symbol: CellSymbol;
  pos: Vector4i;
}

export interface MoveAnalysis {
  quality: MoveQuality;
  badgeText: string;
  badgeColor: string;
  commentary: string;
  tip: string;
  suggestedMove: Vector4i;
  accuracy: number; // 0 a 100
}

export interface GameReviewReport {
  analyses: MoveAnalysis[];
  accuracyX: number;
  accuracyO: number;
  moveHistory: MoveRecord[];
}
