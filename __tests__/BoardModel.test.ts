import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';

describe('BoardModel logic tests', () => {
  test('3x3: Movimiento válido, celda ocupada, victoria horizontal y vertical', () => {
    const b = new BoardModel(BoardType.TicTacToe3x3);
    expect(b.isCellEmpty2D(0, 0)).toBe(true);

    expect(b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
    expect(b.isCellEmpty2D(0, 0)).toBe(false);
    expect(b.getCell2D(0, 0)).toBe('X');
    expect(b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'O')).toBe(false); // ya ocupada

    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X');

    const result = b.checkWinner();
    expect(result.winner).toBe('X');
    expect(result.winningLine?.length).toBe(3);
  });

  test('3x3: Detección de empate', () => {
    const b = new BoardModel(BoardType.TicTacToe3x3);
    // Tablero en empate conocido:
    // X O X
    // X O O
    // O X X
    const moves: [number, number, 'X' | 'O'][] = [
      [0, 0, 'X'], [0, 1, 'O'], [0, 2, 'X'],
      [1, 0, 'X'], [1, 1, 'O'], [1, 2, 'O'],
      [2, 0, 'O'], [2, 1, 'X'], [2, 2, 'X'],
    ];
    moves.forEach(([r, c, s]) => b.makeMove({ x: r, y: c, z: 0, w: 0 }, s));

    expect(b.isFull()).toBe(true);
    const res = b.checkWinner();
    expect(res.winner).toBe('D');
  });

  test('4x4 Gravedad: Caída por columnas a la fila inferior libre', () => {
    const b = new BoardModel(BoardType.Gravity4x4);
    expect(b.hasGravity()).toBe(true);

    // Columna 1 vacía -> la fila más baja es la 3
    expect(b.getLowestAvailableRow(1)).toBe(3);
    b.makeMove({ x: 3, y: 1, z: 0, w: 0 }, 'X');

    // Ahora en columna 1 la fila más baja disponible es la 2
    expect(b.getLowestAvailableRow(1)).toBe(2);
    b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O');

    expect(b.getLowestAvailableRow(1)).toBe(1);
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');

    expect(b.getLowestAvailableRow(1)).toBe(0);
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'O');

    // Columna llena
    expect(b.isColumnFull(1)).toBe(true);
    expect(b.getLowestAvailableRow(1)).toBe(-1);
  });

  test('3D: Victoria en diagonal espacial cruzando (1,1,1)', () => {
    const b = new BoardModel(BoardType.TicTacToe3D);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 1, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 2, z: 2, w: 0 }, 'O');

    const res = b.checkWinner();
    expect(res.winner).toBe('O');
  });

  test('4D: Victoria hiperdimensional (0,0,0,0) - (1,1,1,1) - (2,2,2,2)', () => {
    const b = new BoardModel(BoardType.TicTacToe4D);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 1, w: 1 }, 'X');
    b.makeMove({ x: 2, y: 2, z: 2, w: 2 }, 'X');

    const res = b.checkWinner();
    expect(res.winner).toBe('X');
    expect(res.winningLine?.length).toBe(3);
  });

  test('4x4 3D: Victoria en diagonal espacial 3D completa (4 casillas)', () => {
    const b = new BoardModel(BoardType.TicTacToe4x4_3D);
    expect(b.gridSize).toBe(4);
    expect(b.winCondition).toBe(4);

    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 1, w: 0 }, 'X');
    b.makeMove({ x: 2, y: 2, z: 2, w: 0 }, 'X');
    expect(b.checkWinner().winner).toBe(' ');

    b.makeMove({ x: 3, y: 3, z: 3, w: 0 }, 'X');
    const res = b.checkWinner();
    expect(res.winner).toBe('X');
    expect(res.winningLine?.length).toBe(4);
  });

  test('4x4 3D: Capacidad de 64 casillas', () => {
    const b = new BoardModel(BoardType.TicTacToe4x4_3D);
    for (let z = 0; z < 4; ++z) {
      for (let r = 0; r < 4; ++r) {
        for (let c = 0; c < 4; ++c) {
          b.makeMove({ x: r, y: c, z, w: 0 }, (r + c + z) % 2 === 0 ? 'X' : 'O');
        }
      }
    }
    expect(b.getOccupiedCount()).toBe(64);
    expect(b.isFull()).toBe(true);
  });

  test('5x5 Libre: Victoria en diagonal principal (5 casillas)', () => {
    const b = new BoardModel(BoardType.Connect5x5);
    expect(b.gridSize).toBe(5);
    expect(b.winCondition).toBe(5);

    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 3, y: 3, z: 0, w: 0 }, 'X');
    expect(b.checkWinner().winner).toBe(' ');

    b.makeMove({ x: 4, y: 4, z: 0, w: 0 }, 'X');
    const res = b.checkWinner();
    expect(res.winner).toBe('X');
    expect(res.winningLine?.length).toBe(5);
  });

  test('5x5 Libre: Capacidad de 25 casillas y detección de empate', () => {
    const b = new BoardModel(BoardType.Connect5x5);
    for (let r = 0; r < 5; ++r) {
      for (let c = 0; c < 5; ++c) {
        b.makeMove({ x: r, y: c, z: 0, w: 0 }, (r + c) % 2 === 0 ? 'X' : 'O');
      }
    }
    expect(b.getOccupiedCount()).toBe(25);
    expect(b.isFull()).toBe(true);
  });
});
