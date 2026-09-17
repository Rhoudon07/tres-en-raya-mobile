import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType, Vector4i } from '../src/types/board';

describe('ObstaclesBoard (Modo 4x4 con Obstáculos)', () => {
  let board: BoardModel;

  beforeEach(() => {
    board = new BoardModel(BoardType.Obstacles4x4);
  });

  test('inicializa con obstáculos por defecto y 14 casillas válidas', () => {
    expect(board.isObstacles()).toBe(true);
    expect(board.gridSize).toBe(4);
    expect(board.winCondition).toBe(4);

    const corner1: Vector4i = { x: 0, y: 0, z: 0, w: 0 };
    const corner2: Vector4i = { x: 3, y: 3, z: 0, w: 0 };

    expect(board.isCellBlocked(corner1)).toBe(true);
    expect(board.isCellBlocked(corner2)).toBe(true);
    expect(board.getCell(corner1)).toBe('#');
    expect(board.getCell(corner2)).toBe('#');

    const validMoves = board.getValidMoves();
    expect(validMoves.length).toBe(14);
    expect(validMoves.some((m) => m.x === 0 && m.y === 0)).toBe(false);
    expect(validMoves.some((m) => m.x === 3 && m.y === 3)).toBe(false);
  });

  test('rechaza jugadas sobre casillas con obstáculos', () => {
    const blockedPos: Vector4i = { x: 0, y: 0, z: 0, w: 0 };
    expect(board.isMoveValid(blockedPos)).toBe(false);
    expect(board.makeMove(blockedPos, 'X')).toBe(false);
    expect(board.getCell(blockedPos)).toBe('#');
  });

  test('una línea con obstáculo no puede formar victoria', () => {
    // Fila 0 tiene (0,0) bloqueado.
    // Llenar (0,1), (0,2), (0,3) con X
    expect(board.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X')).toBe(true);
    expect(board.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X')).toBe(true);
    expect(board.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'X')).toBe(true);

    const result = board.checkWinner();
    expect(result.winner).toBe(' '); // No hay 4 en raya porque (0,0) es '#'
  });

  test('una línea limpia sin obstáculos permite la victoria con 4 en raya', () => {
    // Fila 1 está totalmente libre de obstáculos
    expect(board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
    expect(board.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X')).toBe(true);
    expect(board.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X')).toBe(true);
    expect(board.makeMove({ x: 1, y: 3, z: 0, w: 0 }, 'X')).toBe(true);

    const result = board.checkWinner();
    expect(result.winner).toBe('X');
    expect(result.winningLine?.length).toBe(4);
  });

  test('reset reinstaura los obstáculos y vacía el resto', () => {
    board.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X');
    board.reset();

    expect(board.isCellBlocked({ x: 0, y: 0, z: 0, w: 0 })).toBe(true);
    expect(board.isCellBlocked({ x: 3, y: 3, z: 0, w: 0 })).toBe(true);
    expect(board.getCell({ x: 1, y: 0, z: 0, w: 0 })).toBe(' ');
    expect(board.getValidMoves().length).toBe(14);
  });
});
