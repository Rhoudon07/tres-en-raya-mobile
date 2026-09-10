/**
 * Tipos de Inteligencia Artificial
 */

export enum Difficulty {
  Easy = 'Easy',     // Movimientos aleatorios y baja precisión
  Medium = 'Medium', // Bloquea y ataca, con fallos ocasionales y búsqueda reducida
  Hard = 'Hard',     // Minimax puro óptimo imbatible
}

export interface BestMoveResult {
  pos: import('./board').Vector4i;
  score?: number;
}
