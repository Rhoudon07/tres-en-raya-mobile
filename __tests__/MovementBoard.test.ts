import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType, Vector4i } from '../src/types/board';

describe('MovementBoard (Tres en Raya con Movimiento)', () => {
  let board: BoardModel;

  beforeEach(() => {
    board = new BoardModel(BoardType.Movement3x3);
  });

  test('debe inicializarse en fase de colocación y reconocer modalidad', () => {
    expect(board.isMovement()).toBe(true);
    expect(board.isMovementPhase()).toBe(false);
    expect(board.getPieceCount('X')).toBe(0);
    expect(board.getPieceCount('O')).toBe(0);
    expect(board.getValidMoves().length).toBe(9);
  });

  test('permite colocar exactamente 3 fichas por jugador en fase de colocación', () => {
    // X coloca (0,0)
    expect(board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
    // O coloca (1,0)
    expect(board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O')).toBe(true);
    // X coloca (0,1)
    expect(board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X')).toBe(true);
    // O coloca (1,1)
    expect(board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O')).toBe(true);
    // X coloca (2,2)
    expect(board.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X')).toBe(true);
    // O coloca (2,0)
    expect(board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O')).toBe(true);

    expect(board.getPieceCount('X')).toBe(3);
    expect(board.getPieceCount('O')).toBe(3);
    expect(board.isMovementPhase()).toBe(true);

    // Intentar colocar una 4ª ficha en colocación debe fallar
    expect(board.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X')).toBe(false);
  });

  test('permite ganar en fase de colocación si se alinean 3 fichas', () => {
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X'); // 3 en fila (0,0)-(0,1)-(0,2)

    const result = board.checkWinner();
    expect(result.winner).toBe('X');
    expect(result.winningLine?.length).toBe(3);
  });

  test('valida correctamente adyacencia de casillas (distancia Chebyshev)', () => {
    const center: Vector4i = { x: 1, y: 1, z: 0, w: 0 };
    const corner: Vector4i = { x: 0, y: 0, z: 0, w: 0 };
    const orthogonal: Vector4i = { x: 1, y: 2, z: 0, w: 0 };
    const far: Vector4i = { x: 0, y: 2, z: 0, w: 0 };

    expect(board.isAdjacent(center, corner)).toBe(true);
    expect(board.isAdjacent(center, orthogonal)).toBe(true);
    expect(board.isAdjacent(corner, far)).toBe(false); // salto de 2 casillas
  });

  test('fase de movimiento: desplaza ficha a casilla adyacente vacía', () => {
    // Configurar 6 fichas
    // X en (0,0), (0,1), (2,0)
    // O en (1,0), (1,1), (2,1)
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O');

    expect(board.isMovementPhase()).toBe(true);

    // Casillas vacías son (0,2), (1,2), (2,2)
    // X en (0,1) se mueve a (0,2) [adyacente y vacía] -> ¡3 en raya para X!
    const from: Vector4i = { x: 2, y: 0, z: 0, w: 0 };
    const to: Vector4i = { x: 0, y: 2, z: 0, w: 0 }; // no es adyacente a (2,0)
    expect(board.movePiece(from, to, 'X')).toBe(false);

    // Mover X de (0,1) a (0,2) es adyacente
    const fromX: Vector4i = { x: 0, y: 1, z: 0, w: 0 };
    const toX: Vector4i = { x: 0, y: 2, z: 0, w: 0 };
    expect(board.movePiece(fromX, toX, 'X')).toBe(true);

    expect(board.getCell(fromX)).toBe(' ');
    expect(board.getCell(toX)).toBe('X');

    // Deshacer movimiento
    expect(board.undoPieceMove()).toBe(true);
    expect(board.getCell(fromX)).toBe('X');
    expect(board.getCell(toX)).toBe(' ');
  });

  test('victoria por desplazamiento en fase de movimiento', () => {
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X'); // X en (0,0), (0,1), (1,2)
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');

    // X mueve (1,2) a (0,2) [adyacente y libre] -> X completa fila 0: (0,0)-(0,1)-(0,2)!
    expect(board.movePiece({ x: 1, y: 2, z: 0, w: 0 }, { x: 0, y: 2, z: 0, w: 0 }, 'X')).toBe(true);

    const win = board.checkWinner();
    expect(win.winner).toBe('X');
    expect(win.winningLine?.length).toBe(3);
  });

  test('getValidPieceMoves lista correctamente todas las opciones válidas', () => {
    board.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    board.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X');
    board.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');

    const movesX = board.getValidPieceMoves('X');
    expect(movesX.length).toBeGreaterThan(0);
    // Cada movimiento debe originarse en una ficha X y llegar a una celda vacía adyacente
    for (const m of movesX) {
      expect(board.getCell(m.from)).toBe('X');
      expect(board.getCell(m.to)).toBe(' ');
      expect(board.isAdjacent(m.from, m.to)).toBe(true);
    }
  });
});
