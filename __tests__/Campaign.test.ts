import {
  CAMPAIGN_WORLDS,
  CAMPAIGN_LEVELS,
} from '../src/types/campaign';
import { useCampaignStore } from '../src/stores/useCampaignStore';
import { BoardType } from '../src/types/board';

describe('Modo Campaña / Aventura (Fase 12)', () => {
  beforeEach(async () => {
    // Reiniciar estado de campaña antes de cada prueba
    await useCampaignStore.getState().resetCampaign();
  });

  test('Integridad del catálogo de mundos y niveles', () => {
    expect(CAMPAIGN_WORLDS).toHaveLength(3);
    expect(CAMPAIGN_LEVELS).toHaveLength(12);

    // Verificar correspondencia de mundos
    for (const world of CAMPAIGN_WORLDS) {
      expect(world.levelIds.length).toBeGreaterThanOrEqual(4);
      for (const lvlId of world.levelIds) {
        const found = CAMPAIGN_LEVELS.find((l) => l.id === lvlId);
        expect(found).toBeDefined();
        expect(found?.worldId).toBe(world.id);
      }
    }

    // Verificar requisitos de cada nivel
    for (const level of CAMPAIGN_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
      expect(level.description.length).toBeGreaterThan(0);
      expect(level.boardType).toBeDefined();
      expect(level.aiDifficulty).toBeDefined();
      expect(level.starConditions).toHaveLength(3);

      // Si es un nivel de Jefe, debe tener atributos narrativos completos
      if (level.isBoss) {
        expect(level.bossName).toBeDefined();
        expect(level.bossAvatar).toBeDefined();
        expect(level.bossDialogue).toBeDefined();
        expect(level.bossDefeatDialogue).toBeDefined();
      }
    }
  });

  test('Progresión inicial: Solo Nivel 1 desbloqueado', () => {
    const store = useCampaignStore.getState();

    expect(store.isLevelUnlocked(1)).toBe(true);
    expect(store.isLevelUnlocked(2)).toBe(false);
    expect(store.isLevelUnlocked(3)).toBe(false);
    expect(store.getTotalStars()).toBe(0);

    const progress1 = store.getLevelProgress(1);
    expect(progress1.completed).toBe(false);
    expect(progress1.stars).toBe(0);
  });

  test('Completar un nivel desbloquea el siguiente y calcula estrellas y puntuación', async () => {
    const store = useCampaignStore.getState();

    // Completar Nivel 1 con 3 estrellas, 4 movimientos y 90% precisión
    await store.completeLevel(1, 3, 4, 90);

    const after1 = useCampaignStore.getState().getLevelProgress(1);
    expect(after1.completed).toBe(true);
    expect(after1.stars).toBe(3);
    expect(after1.bestMoves).toBe(4);
    expect(after1.highScore).toBeGreaterThan(3000);

    // Nivel 2 ahora debe estar desbloqueado automáticamente
    expect(useCampaignStore.getState().isLevelUnlocked(2)).toBe(true);
    expect(useCampaignStore.getState().isLevelUnlocked(3)).toBe(false);
    expect(useCampaignStore.getState().getTotalStars()).toBe(3);

    // Completar Nivel 2 con 2 estrellas
    await store.completeLevel(2, 2, 6, 80);
    const after2 = useCampaignStore.getState().getLevelProgress(2);
    expect(after2.completed).toBe(true);
    expect(after2.stars).toBe(2);

    // Nivel 3 ahora debe estar desbloqueado y el total de estrellas es 5
    expect(useCampaignStore.getState().isLevelUnlocked(3)).toBe(true);
    expect(useCampaignStore.getState().getTotalStars()).toBe(5);
  });

  test('Los jefes de cada mundo tienen configuraciones correctas', () => {
    const boss1 = CAMPAIGN_LEVELS.find((l) => l.id === 4);
    expect(boss1?.isBoss).toBe(true);
    expect(boss1?.boardType).toBe(BoardType.TimeAttack3x3);
    expect(boss1?.bossName).toContain('Cronometrador');

    const boss2 = CAMPAIGN_LEVELS.find((l) => l.id === 8);
    expect(boss2?.isBoss).toBe(true);
    expect(boss2?.boardType).toBe(BoardType.Custom);
    expect(boss2?.customRules?.obstacles).toBe(3);
    expect(boss2?.bossName).toContain('Cantero');

    const boss3 = CAMPAIGN_LEVELS.find((l) => l.id === 12);
    expect(boss3?.isBoss).toBe(true);
    expect(boss3?.boardType).toBe(BoardType.Ultimate);
    expect(boss3?.bossName).toContain('Arquitecto');
  });

  test('Reinicio de campaña restablece el estado correctamente', async () => {
    const store = useCampaignStore.getState();
    await store.completeLevel(1, 3, 5, 80);
    await store.completeLevel(2, 3, 5, 80);
    expect(useCampaignStore.getState().getTotalStars()).toBe(6);

    await store.resetCampaign();
    expect(useCampaignStore.getState().getTotalStars()).toBe(0);
    expect(useCampaignStore.getState().isLevelUnlocked(1)).toBe(true);
    expect(useCampaignStore.getState().isLevelUnlocked(2)).toBe(false);
  });
});
