import { PUZZLE_CATALOG } from '../src/game/puzzles/PuzzleCatalog';
import { usePuzzleStore } from '../src/stores/usePuzzleStore';
import { BoardModel } from '../src/game/board/BoardModel';

describe('Puzzles (Desafíos Tácticos)', () => {
  test('el catálogo contiene puzzles estructurados y válidos', () => {
    expect(PUZZLE_CATALOG.length).toBeGreaterThanOrEqual(6);
    for (const p of PUZZLE_CATALOG) {
      expect(p.id).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.targetMove).toBeDefined();
      expect(p.initialMoves.length).toBeGreaterThan(0);

      // Simular inicialización en un BoardModel
      const b = new BoardModel(p.boardType);
      for (const m of p.initialMoves) {
        expect(b.makeMove(m.pos, m.symbol)).toBe(true);
      }
      if (b.isMovement() && b.isMovementPhase()) {
        const validDests = b.getValidPieceMoves(p.playerSymbol).map((m) => m.to);
        expect(validDests.some((d) => d.x === p.targetMove.x && d.y === p.targetMove.y)).toBe(true);
      } else {
        expect(b.isMoveValid(p.targetMove)).toBe(true);
      }
    }
  });

  test('usePuzzleStore resuelve correctamente el nivel 1 con la jugada objetivo', () => {
    const store = usePuzzleStore.getState();
    store.loadPuzzle(0); // Nivel 1: Mate en 1 con targetMove (0,2)

    const target = store.currentPuzzle.targetMove;
    const success = store.playMove(target);

    expect(success).toBe(true);
    const updated = usePuzzleStore.getState();
    expect(updated.isSolved).toBe(true);
    expect(updated.isFailed).toBe(false);
    expect(updated.completedPuzzleIds).toContain('puz-1');
  });

  test('usePuzzleStore rechaza una jugada incorrecta y permite reintentar', () => {
    const store = usePuzzleStore.getState();
    store.loadPuzzle(0);

    // En Nivel 1, la jugada correcta es (0,2). Si jugamos (2,2):
    const wrongMove = { x: 2, y: 2, z: 0, w: 0 };
    const success = store.playMove(wrongMove);

    expect(success).toBe(false);
    const updated = usePuzzleStore.getState();
    expect(updated.isSolved).toBe(false);
    expect(updated.isFailed).toBe(true);

    // Reintentar
    store.retryPuzzle();
    const afterRetry = usePuzzleStore.getState();
    expect(afterRetry.isFailed).toBe(false);
    expect(afterRetry.isSolved).toBe(false);
  });
});
