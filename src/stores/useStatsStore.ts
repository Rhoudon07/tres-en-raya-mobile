import { create } from 'zustand';
import { BoardType } from '../types/board';
import { ModeStats, OverallStats, GameMode } from '../types/game';
import { Difficulty } from '../types/ai';
import { StorageService } from '../services/StorageService';

export interface MatchRecord {
  id: string;
  boardType: BoardType;
  mode: GameMode;
  difficulty?: Difficulty;
  winner: 'X' | 'O' | 'D' | 'Y';
  userSymbol: 'X' | 'O' | null;
  result: 'win' | 'loss' | 'draw';
  movesCount: number;
  accuracy?: number;
  timestamp: number;
}

interface StatsState {
  stats: OverallStats;
  matchHistory: MatchRecord[];
  isLoaded: boolean;
  recordMatch: (
    type: BoardType,
    winner: 'X' | 'O' | 'D' | 'Y',
    userSymbol: 'X' | 'O' | null, // null en CPU vs CPU
    accuracyUser?: number,
    extra?: {
      mode?: GameMode;
      difficulty?: Difficulty;
      movesCount?: number;
    }
  ) => void;
  updateLastMatchAccuracy: (type: BoardType, accuracyUser: number) => void;
  clearHistory: () => Promise<void>;
  resetAllStats: () => Promise<void>;
  loadStats: (force?: boolean) => Promise<void>;
}

const createEmptyModeStats = (): ModeStats => ({
  played: 0,
  xWins: 0,
  oWins: 0,
  draws: 0,
  totalAccuracy: 0,
  accuracyCount: 0,
});

const DEFAULT_STATS: OverallStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  totalAccuracy: 0,
  accuracyCount: 0,
  byMode: {
    [BoardType.TicTacToe3x3]: createEmptyModeStats(),
    [BoardType.Connect4x4]: createEmptyModeStats(),
    [BoardType.Connect5x5]: createEmptyModeStats(),
    [BoardType.Gravity4x4]: createEmptyModeStats(),
    [BoardType.TicTacToe3D]: createEmptyModeStats(),
    [BoardType.TicTacToe4x4_3D]: createEmptyModeStats(),
    [BoardType.TicTacToe4D]: createEmptyModeStats(),
    [BoardType.Ultimate]: createEmptyModeStats(),
    [BoardType.Limited3x3]: createEmptyModeStats(),
    [BoardType.Misere3x3]: createEmptyModeStats(),
    [BoardType.Movement3x3]: createEmptyModeStats(),
    [BoardType.TimeAttack3x3]: createEmptyModeStats(),
    [BoardType.Obstacles4x4]: createEmptyModeStats(),
    [BoardType.ThreePlayers3x3]: createEmptyModeStats(),
    [BoardType.ThreePlayers5x5]: createEmptyModeStats(),
    [BoardType.Powers3x3]: createEmptyModeStats(),
    [BoardType.Custom]: createEmptyModeStats(),
  },
};

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: { ...DEFAULT_STATS },
  matchHistory: [],
  isLoaded: false,

  recordMatch: (type, winner, userSymbol, accuracyUser, extra) => {
    const cur = get().stats;
    const mode = cur.byMode[type] ? { ...cur.byMode[type] } : createEmptyModeStats();

    mode.played += 1;
    if (winner === 'X') mode.xWins += 1;
    else if (winner === 'O') mode.oWins += 1;
    else if (winner === 'D') mode.draws += 1;

    let newWins = cur.wins;
    let newLosses = cur.losses;
    let newDraws = cur.draws;

    let result: 'win' | 'loss' | 'draw' = 'draw';
    if (winner === 'D') {
      result = 'draw';
      if (userSymbol) newDraws += 1;
    } else if (userSymbol) {
      if (winner === userSymbol) {
        result = 'win';
        newWins += 1;
      } else {
        result = 'loss';
        newLosses += 1;
      }
    }

    let newTotalAcc = cur.totalAccuracy;
    let newAccCount = cur.accuracyCount;

    if (typeof accuracyUser === 'number' && accuracyUser >= 0) {
      mode.totalAccuracy += accuracyUser;
      mode.accuracyCount += 1;
      newTotalAcc += accuracyUser;
      newAccCount += 1;
    }

    const updatedStats: OverallStats = {
      ...cur,
      gamesPlayed: cur.gamesPlayed + 1,
      wins: newWins,
      losses: newLosses,
      draws: newDraws,
      totalAccuracy: newTotalAcc,
      accuracyCount: newAccCount,
      byMode: {
        ...cur.byMode,
        [type]: mode,
      },
    };

    const newRecord: MatchRecord = {
      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      boardType: type,
      mode: extra?.mode || GameMode.PvCPU,
      difficulty: extra?.difficulty,
      winner,
      userSymbol,
      result,
      movesCount: extra?.movesCount || 0,
      accuracy: accuracyUser,
      timestamp: Date.now(),
    };

    const updatedHistory = [newRecord, ...get().matchHistory].slice(0, 100);

    set({ stats: updatedStats, matchHistory: updatedHistory });
    StorageService.setItem('overall_stats', updatedStats);
    StorageService.setItem('match_history', updatedHistory);
  },

  updateLastMatchAccuracy: (type: BoardType, accuracyUser: number) => {
    if (typeof accuracyUser !== 'number' || accuracyUser < 0) return;
    const cur = get().stats;
    const mode = cur.byMode[type] ? { ...cur.byMode[type] } : createEmptyModeStats();

    mode.totalAccuracy += accuracyUser;
    mode.accuracyCount += 1;
    const newTotalAcc = cur.totalAccuracy + accuracyUser;
    const newAccCount = cur.accuracyCount + 1;

    const updatedStats: OverallStats = {
      ...cur,
      totalAccuracy: newTotalAcc,
      accuracyCount: newAccCount,
      byMode: {
        ...cur.byMode,
        [type]: mode,
      },
    };

    // Actualizar precisión en el registro de partida más reciente si no tenía
    const history = [...get().matchHistory];
    if (history.length > 0 && history[0].boardType === type && history[0].accuracy === undefined) {
      history[0] = { ...history[0], accuracy: accuracyUser };
    }

    set({ stats: updatedStats, matchHistory: history });
    StorageService.setItem('overall_stats', updatedStats);
    StorageService.setItem('match_history', history);
  },

  clearHistory: async () => {
    set({ matchHistory: [] });
    await StorageService.removeItem('match_history');
  },

  resetAllStats: async () => {
    set({ stats: { ...DEFAULT_STATS }, matchHistory: [], isLoaded: true });
    await StorageService.removeItem('overall_stats');
    await StorageService.removeItem('match_history');
  },

  loadStats: async (force = false) => {
    if (!force && get().isLoaded) return;
    const [savedStats, savedHistory] = await Promise.all([
      StorageService.getItem<OverallStats>('overall_stats', DEFAULT_STATS),
      StorageService.getItem<MatchRecord[]>('match_history', []),
    ]);
    set({
      stats: {
        ...DEFAULT_STATS,
        ...(savedStats || {}),
        byMode: {
          ...DEFAULT_STATS.byMode,
          ...(savedStats?.byMode || {}),
        },
      },
      matchHistory: Array.isArray(savedHistory) ? savedHistory : [],
      isLoaded: true,
    });
  },
}));
