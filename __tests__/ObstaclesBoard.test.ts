import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType, Vector4i } from '../src/types/board';

describe('ObstaclesBoard (Modo 4x4 con Obstáculos)', () => {
  let board: BoardModel;

  beforeEach(() => {
    board = new BoardModel(BoardType.Obstacles4x4);
  });

  test('inicializa con obstáculos aleatorios y 14 casillas válidas', () => {
    expect(board.isObstacles()).toBe(true);
    expect(board.gridSize).toBe(4);
    expect(board.winCondition).toBe(4);
    expect(board.obstacles).toBeDefined();
    expect(board.obstacles?.length).toBe(2);

    for (const obs of board.obstacles || []) {
      expect(board.isCellBlocked(obs)).toBe(true);
      expect(board.getCell(obs)).toBe('#');
    }

    const validMoves = board.getValidMoves();
    expect(validMoves.length).toBe(14);
  });

  test('permite obstáculos personalizados y rechaza jugadas sobre ellos', () => {
    const custom = new BoardModel(BoardType.Obstacles4x4, undefined, BoardModel.DEFAULT_OBSTACLES);
    const corner1: Vector4i = { x: 0, y: 0, z: 0, w: 0 };
    expect(custom.isCellBlocked(corner1)).toBe(true);
    expect(custom.getCell(corner1)).toBe('#');
    expect(custom.isMoveValid(corner1)).toBe(false);
    expect(custom.makeMove(corner1, 'X')).toBe(false);
  });

  test('una línea con obstáculo no puede formar victoria', () => {
    const fixedBoard = new BoardModel(BoardType.Obstacles4x4, undefined, BoardModel.DEFAULT_OBSTACLES);
    // Fila 0 tiene (0,0) bloqueado.
    // Llenar (0,1), (0,2), (0,3) con X
    expect(fixedBoard.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X')).toBe(true);
    expect(fixedBoard.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X')).toBe(true);
    expect(fixedBoard.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'X')).toBe(true);

    const result = fixedBoard.checkWinner();
    expect(result.winner).toBe(' '); // No hay 4 en raya porque (0,0) es '#'
  });

  test('una línea limpia sin obstáculos permite la victoria con 4 en raya', () => {
    const fixedBoard = new BoardModel(BoardType.Obstacles4x4, undefined, BoardModel.DEFAULT_OBSTACLES);
    // Fila 1 está totalmente libre de obstáculos
    expect(fixedBoard.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
    expect(fixedBoard.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X')).toBe(true);
    expect(fixedBoard.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X')).toBe(true);
    expect(fixedBoard.makeMove({ x: 1, y: 3, z: 0, w: 0 }, 'X')).toBe(true);

    const result = fixedBoard.checkWinner();
    expect(result.winner).toBe('X');
    expect(result.winningLine?.length).toBe(4);
  });

  test('reset reinstaura los mismos obstáculos y vacía las fichas', () => {
    const validMove = board.getValidMoves()[0];
    board.makeMove(validMove, 'X');
    const initialObstacles = [...(board.obstacles || [])];

    board.reset();

    for (const obs of initialObstacles) {
      expect(board.isCellBlocked(obs)).toBe(true);
      expect(board.getCell(obs)).toBe('#');
    }
    expect(board.getCell(validMove)).toBe(' ');
    expect(board.getValidMoves().length).toBe(14);
  });
});
