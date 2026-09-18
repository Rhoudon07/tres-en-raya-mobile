import { BoardType } from './board';
import { Difficulty } from './ai';

export enum GameState {
  MainMenu = 'MainMenu',
  SelectBoard = 'SelectBoard',
  SelectMode = 'SelectMode',
  SelectTurn = 'SelectTurn',
  Playing = 'Playing',
  GameOver = 'GameOver',
  Analysis = 'Analysis',
}

export enum GameMode {
  PvP = 'PvP',         // Jugador vs Jugador (mismo dispositivo)
  PvCPU = 'PvCPU',     // Jugador vs Computadora
  CPUvCPU = 'CPUvCPU', // Computadora vs Computadora (Espectador)
}

export enum PlayerTurnOrder {
  First = 'First',   // Humano juega 1º (Fichas X)
  Second = 'Second', // Humano juega 2º (Fichas O, CPU inicia con X)
  Random = 'Random', // Turno aleatorio
}

export interface Score {
  xWins: number;
  oWins: number;
  yWins?: number;
  draws: number;
}

export interface ModeStats {
  played: number;
  xWins: number;
  oWins: number;
  yWins?: number;
  draws: number;
  totalAccuracy: number;
  accuracyCount: number;
}

export interface OverallStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalAccuracy: number;
  accuracyCount: number;
  byMode: Record<BoardType, ModeStats>;
}
