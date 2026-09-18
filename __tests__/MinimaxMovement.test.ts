import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { Difficulty } from '../src/types/ai';
import { getBestPlacementMove, getBestPieceMove } from '../src/game/ai/MinimaxMovement';

describe('MinimaxMovement (IA de Tres en Raya con Movimiento)', () => {
  let board: BoardModel;

  beforeEach(() => {
    board = new BoardModel(BoardType.Movement3x3);
  });

  test('fase colocación: IA detecta victoria inmediata en colocación', () => {
    // AI es X
    // X en (0,0) y (0,1) -> Casilla ganadora es (0,2)
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

    const best = getBestPlacementMove(board, 'X', 'O', Difficulty.Hard);
    expect(best).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('fase colocación: IA bloquea victoria inmediata del adversario', () => {
    // Human es X, AI es O
    // X en (0,0) y (0,1) -> Amenaza en (0,2)
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');

    const block = getBestPlacementMove(board, 'O', 'X', Difficulty.Hard);
    expect(block).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('fase movimiento: IA encuentra desplazamiento ganador en 1 jugada', () => {
    // AI es X.
    // X en (0,0), (0,1), (1,2)
    // O en (1,0), (1,1), (2,0)
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');

    expect(board.isMovementPhase()).toBe(true);

    // Mover X de (1,2) a (0,2) completa la fila 0: (0,0)-(0,1)-(0,2)!
    const move = getBestPieceMove(board, 'X', 'O', Difficulty.Hard);
    expect(move.from).toEqual({ x: 1, y: 2, z: 0, w: 0 });
    expect(move.to).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('fase movimiento: IA bloquea victoria inminente del adversario', () => {
    // Human es X, AI es O
    // X en (0,0), (0,1), (1,1) -> X amenaza con mover (1,1) a (0,2) y ganar en fila 0
    // O en (2,0), (1,0), (1,2) -> O en (1,2) es adyacente a (0,2)
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'O');

    expect(board.isMovementPhase()).toBe(true);

    // X amenaza con mover (1,1) a (0,2) y ganar.
    // O debe bloquearlo ocupando (0,2) con su ficha en (1,2).
    const bestMove = getBestPieceMove(board, 'O', 'X', Difficulty.Hard);
    expect(bestMove.to).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('benchmark de rendimiento: IA decide desplazamiento en < 30ms', () => {
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');

    const start = Date.now();
    const move = getBestPieceMove(board, 'X', 'O', Difficulty.Hard);
    const duration = Date.now() - start;

    console.log(`[PERF] Movimiento de IA calculado en: ${duration} ms`);
    expect(duration).toBeLessThan(120);
    expect(move.from).toBeDefined();
    expect(move.to).toBeDefined();
  });
});
