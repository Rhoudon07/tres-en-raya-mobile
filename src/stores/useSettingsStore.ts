import { create } from 'zustand';
import { BoardType } from '../types/board';
import { Difficulty } from '../types/ai';
import { StorageService } from '../services/StorageService';
import { AudioService } from '../services/AudioService';
import { HapticService } from '../services/HapticService';

interface SettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  animationsEnabled: boolean;
  showCoordinates: boolean;
  difficulties: Record<BoardType, Difficulty>;
  isLoaded: boolean;

  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setShowCoordinates: (enabled: boolean) => void;
  setDifficultyFor: (type: BoardType, diff: Difficulty) => void;
  resetSettings: () => Promise<void>;
  loadSettings: (force?: boolean) => Promise<void>;
}

const DEFAULT_DIFFICULTIES: Record<BoardType, Difficulty> = {
  [BoardType.TicTacToe3x3]: Difficulty.Medium,
  [BoardType.Connect4x4]: Difficulty.Medium,
  [BoardType.Connect5x5]: Difficulty.Medium,
  [BoardType.Gravity4x4]: Difficulty.Medium,
  [BoardType.TicTacToe3D]: Difficulty.Easy,
  [BoardType.TicTacToe4x4_3D]: Difficulty.Medium,
  [BoardType.TicTacToe4D]: Difficulty.Easy,
  [BoardType.Ultimate]: Difficulty.Medium,
  [BoardType.Limited3x3]: Difficulty.Medium,
  [BoardType.Misere3x3]: Difficulty.Hard,
  [BoardType.Movement3x3]: Difficulty.Hard,
  [BoardType.TimeAttack3x3]: Difficulty.Medium,
  [BoardType.Obstacles4x4]: Difficulty.Medium,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: true,
  vibrationEnabled: true,
  animationsEnabled: true,
  showCoordinates: true,
  difficulties: { ...DEFAULT_DIFFICULTIES },
  isLoaded: false,

  setSoundEnabled: (enabled: boolean) => {
    AudioService.setEnabled(enabled);
    set({ soundEnabled: enabled });
    StorageService.setItem('setting_sound', enabled);
  },

  setVibrationEnabled: (enabled: boolean) => {
    HapticService.setEnabled(enabled);
    set({ vibrationEnabled: enabled });
    StorageService.setItem('setting_vibration', enabled);
  },

  setAnimationsEnabled: (enabled: boolean) => {
    set({ animationsEnabled: enabled });
    StorageService.setItem('setting_animations', enabled);
  },

  setShowCoordinates: (enabled: boolean) => {
    set({ showCoordinates: enabled });
    StorageService.setItem('setting_show_coords', enabled);
  },

  setDifficultyFor: (type: BoardType, diff: Difficulty) => {
    const updated = { ...get().difficulties, [type]: diff };
    set({ difficulties: updated });
    StorageService.setItem('setting_difficulties', updated);
  },

  resetSettings: async () => {
    set({
      soundEnabled: true,
      vibrationEnabled: true,
      animationsEnabled: true,
      showCoordinates: true,
      difficulties: { ...DEFAULT_DIFFICULTIES },
      isLoaded: true,
    });
    AudioService.setEnabled(true);
    HapticService.setEnabled(true);
    await StorageService.removeItem('setting_sound');
    await StorageService.removeItem('setting_vibration');
    await StorageService.removeItem('setting_animations');
    await StorageService.removeItem('setting_show_coords');
    await StorageService.removeItem('setting_difficulties');
  },

  loadSettings: async (force = false) => {
    if (!force && get().isLoaded) return;
    const sound = await StorageService.getItem<boolean>('setting_sound', true);
    const vibration = await StorageService.getItem<boolean>('setting_vibration', true);
    const animations = await StorageService.getItem<boolean>('setting_animations', true);
    const showCoords = await StorageService.getItem<boolean>('setting_show_coords', true);
    const diffs = await StorageService.getItem<Record<BoardType, Difficulty>>(
      'setting_difficulties',
      DEFAULT_DIFFICULTIES
    );

    AudioService.setEnabled(sound);
    HapticService.setEnabled(vibration);

    set({
      soundEnabled: sound,
      vibrationEnabled: vibration,
      animationsEnabled: animations,
      showCoordinates: showCoords,
      difficulties: { ...DEFAULT_DIFFICULTIES, ...(diffs || {}) },
      isLoaded: true,
    });
  },
}));
