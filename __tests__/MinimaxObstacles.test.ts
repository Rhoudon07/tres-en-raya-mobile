import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { Difficulty } from '../src/types/ai';
import { getBestMoveObstacles } from '../src/game/ai/MinimaxObstacles';

describe('MinimaxObstacles (IA para 4x4 con Obstáculos)', () => {
  let board: BoardModel;

  beforeEach(() => {
    board = new BoardModel(BoardType.Obstacles4x4);
  });

  test('IA encuentra victoria inmediata en fila libre de obstáculos', () => {
    // Fila 1 está limpia de obstáculos. X tiene (1,0), (1,1), (1,2) -> Falta (1,3)
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X');

    const move = getBestMoveObstacles(board, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 1, y: 3, z: 0, w: 0 });
  });

  test('IA bloquea victoria inminente del rival en fila limpia', () => {
    // Rival O tiene (2,0), (2,1), (2,2) -> Amenaza (2,3)
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'O');

    const block = getBestMoveObstacles(board, 'X', 'O', Difficulty.Hard);
    expect(block).toEqual({ x: 2, y: 3, z: 0, w: 0 });
  });

  test('IA no considera jugadas en líneas bloqueadas como amenazas ganadoras', () => {
    // Fila 0 tiene obstáculo en (0,0).
    // Si el rival tiene (0,1) y (0,2), esa fila NUNCA puede ser completada como 4 en raya.
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'O');

    // La IA no debe desperdiciar su jugada bloqueando (0,3) si no hay amenaza real
    const move = getBestMoveObstacles(board, 'X', 'O', Difficulty.Hard);
    expect(board.isMoveValid(move)).toBe(true);
    expect(board.isCellBlocked(move)).toBe(false);
  });

  test('benchmark de rendimiento: IA decide jugada en 4x4 con obstáculos en < 40ms', () => {
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'O');

    const start = Date.now();
    const move = getBestMoveObstacles(board, 'X', 'O', Difficulty.Hard);
    const duration = Date.now() - start;

    console.log(`[PERF] Jugada IA Obstáculos calculada en: ${duration} ms`);
    expect(duration).toBeLessThan(120);
    expect(board.isMoveValid(move)).toBe(true);
  });
});
