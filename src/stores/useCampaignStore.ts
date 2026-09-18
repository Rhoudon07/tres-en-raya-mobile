import { create } from 'zustand';
import {
  CAMPAIGN_LEVELS,
  CampaignLevel,
  CampaignLevelProgress,
} from '../types/campaign';
import { StorageService } from '../services/StorageService';

const STORAGE_KEY = '@tres_en_raya_campaign_progress';

interface CampaignState {
  progress: Record<number, CampaignLevelProgress>;
  activeLevelId: number | null;
  isLoaded: boolean;

  loadCampaign: (force?: boolean) => Promise<void>;
  completeLevel: (
    levelId: number,
    starsEarned: number,
    movesCount: number,
    accuracy?: number
  ) => Promise<void>;
  setActiveLevel: (levelId: number | null) => void;
  isLevelUnlocked: (levelId: number) => boolean;
  getLevelProgress: (levelId: number) => CampaignLevelProgress;
  getTotalStars: () => number;
  resetCampaign: () => Promise<void>;
}

function createDefaultProgress(): Record<number, CampaignLevelProgress> {
  const map: Record<number, CampaignLevelProgress> = {};
  for (const level of CAMPAIGN_LEVELS) {
    map[level.id] = {
      levelId: level.id,
      unlocked: level.id === 1, // El primer nivel está desbloqueado inicialmente
      completed: false,
      stars: 0,
      highScore: 0,
    };
  }
  return map;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  progress: createDefaultProgress(),
  activeLevelId: null,
  isLoaded: false,

  loadCampaign: async (force = false) => {
    if (get().isLoaded && !force) return;
    const defaultData = createDefaultProgress();
    const saved = await StorageService.getItem<Record<number, CampaignLevelProgress>>(
      STORAGE_KEY,
      defaultData
    );

    // Asegurar que todos los niveles del catálogo existan en el mapa
    const merged: Record<number, CampaignLevelProgress> = { ...defaultData };
    for (const id in saved) {
      if (merged[id]) {
        merged[id] = { ...merged[id], ...saved[id] };
      }
    }
    // Asegurar que el nivel 1 siempre esté desbloqueado
    merged[1].unlocked = true;

    set({ progress: merged, isLoaded: true });
  },

  completeLevel: async (
    levelId: number,
    starsEarned: number,
    movesCount: number,
    accuracy = 80
  ) => {
    const currentProgress = { ...get().progress };
    const levelState = currentProgress[levelId] || {
      levelId,
      unlocked: true,
      completed: false,
      stars: 0,
      highScore: 0,
    };

    const newStars = Math.max(levelState.stars, Math.min(3, Math.max(0, starsEarned)));
    const bestMoves =
      levelState.bestMoves !== undefined
        ? Math.min(levelState.bestMoves, movesCount)
        : movesCount;

    const score = Math.round(newStars * 1000 + Math.max(0, 100 - movesCount * 5) + accuracy * 5);
    const newHighScore = Math.max(levelState.highScore, score);

    currentProgress[levelId] = {
      ...levelState,
      completed: true,
      stars: newStars,
      bestMoves,
      highScore: newHighScore,
    };

    // Desbloquear el siguiente nivel si existe
    const nextLevelId = levelId + 1;
    if (currentProgress[nextLevelId]) {
      currentProgress[nextLevelId] = {
        ...currentProgress[nextLevelId],
        unlocked: true,
      };
    }

    set({ progress: currentProgress });
    await StorageService.setItem(STORAGE_KEY, currentProgress);
  },

  setActiveLevel: (levelId: number | null) => {
    set({ activeLevelId: levelId });
  },

  isLevelUnlocked: (levelId: number) => {
    return !!get().progress[levelId]?.unlocked;
  },

  getLevelProgress: (levelId: number) => {
    return (
      get().progress[levelId] || {
        levelId,
        unlocked: levelId === 1,
        completed: false,
        stars: 0,
        highScore: 0,
      }
    );
  },

  getTotalStars: () => {
    const progress = get().progress;
    let total = 0;
    for (const id in progress) {
      total += progress[id]?.stars || 0;
    }
    return total;
  },

  resetCampaign: async () => {
    const fresh = createDefaultProgress();
    set({ progress: fresh, activeLevelId: null });
    await StorageService.setItem(STORAGE_KEY, fresh);
  },
}));
