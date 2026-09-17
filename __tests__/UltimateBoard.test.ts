import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';

describe('Ultimate Tic-Tac-Toe Board Rules & Logic (__tests__/UltimateBoard.test.ts)', () => {
  test('Inicialización correcta de Ultimate Tic-Tac-Toe', () => {
    const b = new BoardModel(BoardType.Ultimate);
    expect(b.type).toBe(BoardType.Ultimate);
    expect(b.gridSize).toBe(3);
    expect(b.winCondition).toBe(3);
    expect(b.activeMacro).toBeNull();
    expect(b.macroBoard.every((s) => s === ' ')).toBe(true);
    expect(b.isFull()).toBe(false);
    expect(b.getValidMoves().length).toBe(81);
  });

  test('Regla de tablero destino forzado', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // Jugador X juega en mini-tablero (0,0) [w=0, z=0] en la casilla micro (1,2)
    // Destino forzado para el rival: micro fila 1, micro col 2 -> macro 1*3 + 2 = 5 (w=1, z=2)
    const move1 = { x: 1, y: 2, z: 0, w: 0 };
    expect(b.makeMove(move1, 'X')).toBe(true);
    expect(b.activeMacro).toBe(5);

    // Movimiento inválido: El rival 'O' intenta jugar en mini-tablero 0 en lugar del 5
    const invalidMove = { x: 0, y: 0, z: 0, w: 0 };
    expect(b.makeMove(invalidMove, 'O')).toBe(false);
    expect(b.isMoveValid(invalidMove)).toBe(false);

    // Movimiento válido: El rival juega dentro del mini-tablero 5 [w=1, z=2]
    // Juega en micro (0,1) -> Destino forzado para X: macro 0*3 + 1 = 1 [w=0, z=1]
    const validMove = { x: 0, y: 1, z: 2, w: 1 };
    expect(b.isMoveValid(validMove)).toBe(true);
    expect(b.makeMove(validMove, 'O')).toBe(true);
    expect(b.activeMacro).toBe(1);
  });

  test('Victoria de un mini-tablero', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // Mini-tablero 4 (el centro: w=1, z=1)
    // Simulamos que el juego permite jugar en el centro fijando activeMacro = 4
    b.activeMacro = 4;

    // Fila 0 de mini-tablero 4: (0,0), (0,1), (0,2)
    b.makeMove({ x: 0, y: 0, z: 1, w: 1 }, 'X');
    b.activeMacro = 4; // forzamos retorno para test
    b.makeMove({ x: 1, y: 0, z: 1, w: 1 }, 'O');
    b.activeMacro = 4;
    b.makeMove({ x: 0, y: 1, z: 1, w: 1 }, 'X');
    b.activeMacro = 4;
    b.makeMove({ x: 1, y: 1, z: 1, w: 1 }, 'O');
    b.activeMacro = 4;
    // Jugada ganadora del mini-tablero para X
    b.makeMove({ x: 0, y: 2, z: 1, w: 1 }, 'X');

    // Mini-tablero 4 debe haber sido conquistado por X
    expect(b.macroBoard[4]).toBe('X');
    expect(b.getMiniBoardWinner(4)).toBe('X');
    expect(b.getMiniBoardWinningLine(4)).not.toBeNull();
  });

  test('Tablero destino ganado permite jugar libremente en cualquier otro mini-tablero abierto', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // Mini-tablero 0 ya conquistado por X
    b.macroBoard[0] = 'X';

    // Jugador juega una casilla micro (0,0) que enviaría al mini-tablero 0
    b.activeMacro = 4; // juega en el centro
    const move = { x: 0, y: 0, z: 1, w: 1 }; // micro (0,0) -> target = 0
    expect(b.makeMove(move, 'O')).toBe(true);

    // Como mini-tablero 0 ya está ganado, activeMacro debe ser null (tablero libre)
    expect(b.activeMacro).toBeNull();

    // El rival debe poder jugar en mini-tablero 1, 2, 3, etc. pero NO en el 0 (ya ganado)
    expect(b.isMoveValid({ x: 1, y: 1, z: 1, w: 0 })).toBe(true); // macro 1
    expect(b.isMoveValid({ x: 1, y: 1, z: 0, w: 0 })).toBe(false); // macro 0 (bloqueado)
  });

  test('Empate local en un mini-tablero (todas las casillas llenas sin ganador)', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // Mini-tablero 2 [w=0, z=2]
    // Llenamos con un empate clásico:
    // X O X
    // X O O
    // O X X
    const drawPattern: [number, number, 'X' | 'O'][] = [
      [0, 0, 'X'], [0, 1, 'O'], [0, 2, 'X'],
      [1, 0, 'X'], [1, 1, 'O'], [1, 2, 'O'],
      [2, 0, 'O'], [2, 1, 'X'], [2, 2, 'X'],
    ];

    for (const [r, c, s] of drawPattern) {
      b.activeMacro = 2;
      b.makeMove({ x: r, y: c, z: 2, w: 0 }, s);
    }

    expect(b.macroBoard[2]).toBe('D');
    expect(b.getMiniBoardWinner(2)).toBe('D');

    // Jugar hacia el mini-tablero 2 cerrado libera el turno
    b.activeMacro = 8;
    b.makeMove({ x: 0, y: 2, z: 2, w: 2 }, 'X'); // target 0*3+2 = 2
    expect(b.activeMacro).toBeNull();
  });

  test('Victoria Global: 3 mini-tableros alineados en el macro-tablero', () => {
    const b = new BoardModel(BoardType.Ultimate);

    // X conquista mini-tablero 0, 1 y 2 (fila superior del macro-tablero)
    b.macroBoard[0] = 'X';
    b.macroBoard[1] = 'X';
    expect(b.checkWinner().winner).toBe(' ');

    b.macroBoard[2] = 'X';
    const result = b.checkWinner();
    expect(result.winner).toBe('X');
    expect(result.winningLine?.length).toBe(3);
    // Coordenadas macro deben corresponder a (w=0, z=0), (w=0, z=1), (w=0, z=2)
    expect(result.winningLine).toEqual([
      { x: 1, y: 1, z: 0, w: 0 },
      { x: 1, y: 1, z: 1, w: 0 },
      { x: 1, y: 1, z: 2, w: 0 },
    ]);
  });

  test('Victoria Global en diagonal macro (0, 4, 8)', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.macroBoard[0] = 'O';
    b.macroBoard[4] = 'O';
    b.macroBoard[8] = 'O';

    const result = b.checkWinner();
    expect(result.winner).toBe('O');
  });

  test('Empate Global cuando todos los mini-tableros terminan sin ganador de 3 en raya', () => {
    const b = new BoardModel(BoardType.Ultimate);
    // Macro-tablero en empate:
    // X O X
    // X O O
    // O X X
    b.macroBoard = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    const result = b.checkWinner();
    expect(result.winner).toBe('D');
  });

  test('undoMove restaura fielmente el estado previo de activeMacro y macroBoard en Ultimate', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.activeMacro = 3;
    const move = { x: 2, y: 2, z: 0, w: 1 }; // macro 3, micro (2,2) -> target 8

    b.makeMove(move, 'X');
    expect(b.activeMacro).toBe(8);
    expect(b.getCell(move)).toBe('X');

    // Deshacer movimiento
    b.undoMove(move);
    expect(b.getCell(move)).toBe(' ');
    expect(b.activeMacro).toBe(3);
    expect(b.macroBoard[3]).toBe(' ');
  });

  test('clone() duplica con precisión quirúrgica el estado de Ultimate', () => {
    const b = new BoardModel(BoardType.Ultimate);
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
    b.macroBoard[0] = 'X';

    const clone = b.clone();
    expect(clone.type).toBe(BoardType.Ultimate);
    expect(clone.activeMacro).toBe(b.activeMacro);
    expect(clone.macroBoard[0]).toBe('X');
    expect(clone.getCell({ x: 1, y: 1, z: 0, w: 0 })).toBe('X');

    // Mutaciones en el clon no afectan al original
    clone.makeMove({ x: 0, y: 0, z: 1, w: 1 }, 'O');
    expect(b.getCell({ x: 0, y: 0, z: 1, w: 1 })).toBe(' ');
  });
});
