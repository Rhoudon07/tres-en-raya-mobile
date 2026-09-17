import { ReviewEngine } from '../src/game/review/ReviewEngine';
import { BoardType } from '../src/types/board';
import { MoveQuality, MoveRecord } from '../src/types/review';

describe('ReviewEngine (Game Review & Accuracy)', () => {
  test('Partida corta 3x3: Victoria de X en fila 0', () => {
    // 1. X en (0,0)
    // 2. O en (1,0)
    // 3. X en (0,1)
    // 4. O en (2,0)
    // 5. X en (0,2) -> Victoria inmediata!
    const history: MoveRecord[] = [
      { symbol: 'X', pos: { x: 0, y: 0, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 1, y: 0, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 0, y: 1, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 2, y: 0, z: 0, w: 0 } }, // O omitió bloquear (0,2)!
      { symbol: 'X', pos: { x: 0, y: 2, z: 0, w: 0 } }, // X gana!
    ];

    const report = ReviewEngine.analyzeGame(BoardType.TicTacToe3x3, history);

    expect(report.analyses.length).toBe(5);

    // La jugada 5 de X debe ser Mejor Jugada (Victoria)
    expect(report.analyses[4].quality).toBe(MoveQuality.Best);
    expect(report.analyses[4].accuracy).toBe(100);

    // La jugada 4 de O debe ser Pifia Grave (no bloqueó la victoria inminente de X en 0,2)
    expect(report.analyses[3].quality).toBe(MoveQuality.Blunder);
    expect(report.analyses[3].accuracy).toBe(0);
    expect(report.analyses[3].suggestedMove).toEqual({ x: 0, y: 2, z: 0, w: 0 });

    // Precisión de X debe ser alta y la de O debe ser reducida por la pifia
    expect(report.accuracyX).toBeGreaterThan(80);
    expect(report.accuracyO).toBeLessThan(60);
  });

  test('Partida 4x4 3D: Victoria en diagonal espacial evaluada correctamente', () => {
    const history: MoveRecord[] = [
      { symbol: 'X', pos: { x: 0, y: 0, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 0, y: 1, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 1, y: 1, z: 1, w: 0 } },
      { symbol: 'O', pos: { x: 0, y: 2, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 2, y: 2, z: 2, w: 0 } },
      { symbol: 'O', pos: { x: 0, y: 3, z: 0, w: 0 } }, // Pifia: no bloquea (3,3,3)!
      { symbol: 'X', pos: { x: 3, y: 3, z: 3, w: 0 } }, // Victoria!
    ];

    const report = ReviewEngine.analyzeGame(BoardType.TicTacToe4x4_3D, history);

    expect(report.analyses.length).toBe(7);
    expect(report.analyses[6].quality).toBe(MoveQuality.Best);
    expect(report.analyses[6].accuracy).toBe(100);

    // Jugada 6 de O no bloqueó (3,3,3)
    expect(report.analyses[5].quality).toBe(MoveQuality.Blunder);
    expect(report.analyses[5].suggestedMove).toEqual({ x: 3, y: 3, z: 3, w: 0 });
  });
});
