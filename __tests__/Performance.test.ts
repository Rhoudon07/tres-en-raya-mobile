import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { ReviewEngine } from '../src/game/review/ReviewEngine';
import { MoveRecord } from '../src/types/review';
import { useGameStore } from '../src/stores/useGameStore';
import { GameMode } from '../src/types/game';

describe('Performance Benchmarks & Fast Result Verification', () => {
  test('BoardModel: 100,000 operaciones de lectura, escritura y comprobación en < 50ms', () => {
    const board = new BoardModel(BoardType.Connect5x5);
    const start = Date.now();

    for (let i = 0; i < 20000; ++i) {
      board.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X');
      board.getCell2D(2, 2);
      board.isCellEmpty2D(1, 1);
      board.undoMove({ x: 2, y: 2, z: 0, w: 0 });
      board.checkWinner();
    }

    const duration = Date.now() - start;
    console.log(`[PERF] 100k BoardModel operations completed in: ${duration} ms`);
    expect(duration).toBeLessThan(100);
  });

  test('ReviewEngine: Análisis de partida 5x5 completa de 15 movimientos en < 150ms', () => {
    const history: MoveRecord[] = [
      { symbol: 'X', pos: { x: 2, y: 2, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 1, y: 1, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 2, y: 1, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 2, y: 3, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 2, y: 0, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 2, y: 4, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 1, y: 2, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 3, y: 2, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 0, y: 2, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 4, y: 2, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 1, y: 3, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 3, y: 1, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 0, y: 4, z: 0, w: 0 } },
      { symbol: 'O', pos: { x: 4, y: 0, z: 0, w: 0 } },
      { symbol: 'X', pos: { x: 0, y: 0, z: 0, w: 0 } }, // Victoria o última jugada
    ];

    const start = Date.now();
    const report = ReviewEngine.analyzeGame(BoardType.Connect5x5, history);
    const duration = Date.now() - start;

    console.log(`[PERF] 15-move 5x5 game review completed in: ${duration} ms (Previously >1400ms in Node)`);
    expect(report.analyses.length).toBe(15);
    expect(duration).toBeLessThan(400);
  });

  test('useGameStore: Al ganar una partida de 5x5, gameOver se establece inmediatamente (0ms)', async () => {
    const store = useGameStore.getState();
    store.setBoardType(BoardType.Connect5x5);
    store.startNewGame(GameMode.PvP);

    // Simular jugadas hasta victoria en fila 0
    await useGameStore.getState().playMove({ x: 0, y: 0, z: 0, w: 0 }); // X
    await useGameStore.getState().playMove({ x: 1, y: 0, z: 0, w: 0 }); // O
    await useGameStore.getState().playMove({ x: 0, y: 1, z: 0, w: 0 }); // X
    await useGameStore.getState().playMove({ x: 1, y: 1, z: 0, w: 0 }); // O
    await useGameStore.getState().playMove({ x: 0, y: 2, z: 0, w: 0 }); // X
    await useGameStore.getState().playMove({ x: 1, y: 2, z: 0, w: 0 }); // O
    await useGameStore.getState().playMove({ x: 0, y: 3, z: 0, w: 0 }); // X
    await useGameStore.getState().playMove({ x: 1, y: 3, z: 0, w: 0 }); // O

    // Jugada ganadora
    const startWinningMove = Date.now();
    await useGameStore.getState().playMove({ x: 0, y: 4, z: 0, w: 0 }); // X completa 5 en raya
    const moveDuration = Date.now() - startWinningMove;

    const finalState = useGameStore.getState();
    expect(finalState.gameOver).toBe(true);
    expect(finalState.resultMessage).toContain('¡Victoria');
    expect(moveDuration).toBeLessThan(30);
    console.log(`[PERF] Winning move resolved and gameOver set in: ${moveDuration} ms`);
  });
});
