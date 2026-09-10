import { create } from 'zustand';
import { BoardType } from '../types/board';
import { ModeStats, OverallStats } from '../types/game';
import { StorageService } from '../services/StorageService';

interface StatsState {
  stats: OverallStats;
  recordMatch: (
    type: BoardType,
    winner: 'X' | 'O' | 'D',
    userSymbol: 'X' | 'O' | null, // null en CPU vs CPU
    accuracyUser?: number
  ) => void;
  resetAllStats: () => Promise<void>;
  loadStats: () => Promise<void>;
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
    [BoardType.Gravity4x4]: createEmptyModeStats(),
    [BoardType.TicTacToe3D]: createEmptyModeStats(),
    [BoardType.TicTacToe4D]: createEmptyModeStats(),
  },
};

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: { ...DEFAULT_STATS },

  recordMatch: (type, winner, userSymbol, accuracyUser) => {
    const cur = get().stats;
    const mode = cur.byMode[type] ? { ...cur.byMode[type] } : createEmptyModeStats();

    mode.played += 1;
    if (winner === 'X') mode.xWins += 1;
    else if (winner === 'O') mode.oWins += 1;
    else if (winner === 'D') mode.draws += 1;

    let newWins = cur.wins;
    let newLosses = cur.losses;
    let newDraws = cur.draws;

    if (userSymbol) {
      if (winner === userSymbol) newWins += 1;
      else if (winner === 'D') newDraws += 1;
      else newLosses += 1;
    }

    let newTotalAcc = cur.totalAccuracy;
    let newAccCount = cur.accuracyCount;

    if (typeof accuracyUser === 'number' && accuracyUser >= 0) {
      mode.totalAccuracy += accuracyUser;
      mode.accuracyCount += 1;
      newTotalAcc += accuracyUser;
      newAccCount += 1;
    }

    const updated: OverallStats = {
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

    set({ stats: updated });
    StorageService.setItem('overall_stats', updated);
  },

  resetAllStats: async () => {
    set({ stats: { ...DEFAULT_STATS } });
    await StorageService.removeItem('overall_stats');
  },

  loadStats: async () => {
    const saved = await StorageService.getItem<OverallStats>('overall_stats', DEFAULT_STATS);
    set({ stats: saved });
  },
}));
