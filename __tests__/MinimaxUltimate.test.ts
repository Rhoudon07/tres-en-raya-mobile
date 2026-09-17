import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { Difficulty } from '../src/types/ai';
import { AIEngine } from '../src/game/ai/AIEngine';

describe('AIEngine Ultimate Tic-Tac-Toe Tests (__tests__/MinimaxUltimate.test.ts)', () => {
  test('En Hard completa victoria inmediata de mini-tablero servida', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.activeMacro = 0; // Mini-tablero 0 (w=0, z=0)

    // X tiene dos en fila en mini-tablero 0: (0,0) y (0,1)
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.activeMacro = 0;
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.activeMacro = 0;
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.activeMacro = 0;

    // AI es 'X' y le toca jugar en mini-tablero 0: debe jugar (0,2,0,0)
    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('En Hard bloquea victoria inminente del adversario en mini-tablero', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.activeMacro = 4; // Mini-tablero 4 (centro: w=1, z=1)

    // O tiene amenaza en fila 1: (1,0) y (1,1)
    b.makeMove({ x: 1, y: 0, z: 1, w: 1 }, 'O');
    b.activeMacro = 4;
    b.makeMove({ x: 0, y: 0, z: 1, w: 1 }, 'X');
    b.activeMacro = 4;
    b.makeMove({ x: 1, y: 1, z: 1, w: 1 }, 'O');
    b.activeMacro = 4;

    // AI es 'X': debe bloquear en (1,2,1,1)
    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 1, y: 2, z: 1, w: 1 });
  });

  test('En Hard completa victoria global al ganar el tercer mini-tablero en línea', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // X ya conquistó mini-tablero 0 y 1
    b.macroBoard[0] = 'X';
    b.macroBoard[1] = 'X';

    // En mini-tablero 2 (w=0, z=2), X tiene (0,0) y (0,1)
    b.activeMacro = 2;
    b.makeMove({ x: 0, y: 0, z: 2, w: 0 }, 'X');
    b.activeMacro = 2;
    b.makeMove({ x: 1, y: 0, z: 2, w: 0 }, 'O');
    b.activeMacro = 2;
    b.makeMove({ x: 0, y: 1, z: 2, w: 0 }, 'X');
    b.activeMacro = 2;

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 0, y: 2, z: 2, w: 0 });

    // Ejecutar la jugada debe dar victoria global a X
    b.makeMove(move, 'X');
    expect(b.checkWinner().winner).toBe('X');
  });

  test('En Hard bloquea victoria global inminente del adversario', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // O ya conquistó mini-tableros 0 y 1
    b.macroBoard[0] = 'O';
    b.macroBoard[1] = 'O';

    // En mini-tablero 2 (w=0, z=2), O tiene (0,0) y (0,1) listos para ganar el match
    b.activeMacro = 2;
    b.makeMove({ x: 0, y: 0, z: 2, w: 0 }, 'O');
    b.activeMacro = 2;
    b.makeMove({ x: 1, y: 0, z: 2, w: 0 }, 'X');
    b.activeMacro = 2;
    b.makeMove({ x: 0, y: 1, z: 2, w: 0 }, 'O');
    b.activeMacro = 2;

    // AI 'X' debe bloquear la casilla (0,2) para evitar la derrota global
    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 0, y: 2, z: 2, w: 0 });
  });

  test('AI siempre respeta la restricción de activeMacro', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.activeMacro = 7; // Mini-tablero 7 (w=2, z=1)

    const move = AIEngine.getBestMoveSync(b, 'O', 'X', Difficulty.Hard);
    const macroIdx = move.w * 3 + move.z;
    expect(macroIdx).toBe(7);
    expect(b.isMoveValid(move)).toBe(true);
  });

  test('Rendimiento: Decisión en Hard con tablero abierto se calcula en < 200 ms', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.activeMacro = null; // Toda la cuadrícula libre (81 opciones)

    const start = Date.now();
    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    const duration = Date.now() - start;

    expect(b.isMoveValid(move)).toBe(true);
    expect(duration).toBeLessThan(200);
    console.log(`[PERF] Ultimate AI move computed in: ${duration} ms (81 candidate moves)`);
  });
});
