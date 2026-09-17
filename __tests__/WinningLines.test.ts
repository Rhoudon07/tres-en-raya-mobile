import { getWinningLines, countWinningLinesPassingThrough } from '../src/game/board/WinningLines';
import { BoardType } from '../src/types/board';

describe('WinningLines generator tests', () => {
  test('3x3 Clásico debe tener exactamente 8 líneas ganadoras', () => {
    const lines = getWinningLines(BoardType.TicTacToe3x3);
    expect(lines.length).toBe(8);
  });

  test('4x4 Libre debe tener exactamente 10 líneas ganadoras', () => {
    const lines = getWinningLines(BoardType.Connect4x4);
    expect(lines.length).toBe(10);
    lines.forEach((line) => expect(line.length).toBe(4));
  });

  test('4x4 Gravedad debe tener exactamente 10 líneas ganadoras', () => {
    const lines = getWinningLines(BoardType.Gravity4x4);
    expect(lines.length).toBe(10);
  });

  test('3D Qubic debe tener exactamente 49 líneas ganadoras', () => {
    const lines = getWinningLines(BoardType.TicTacToe3D);
    expect(lines.length).toBe(49);
    lines.forEach((line) => expect(line.length).toBe(3));

    // El centro (1,1,1) debe estar atravesado por 13 líneas:
    // 3 axiales (1 fila, 1 col, 1 pilar) + 6 diagonales planas (2 XY, 2 XZ, 2 YZ) + 4 espaciales = 13
    const centerLines = countWinningLinesPassingThrough({ x: 1, y: 1, z: 1, w: 0 }, BoardType.TicTacToe3D);
    expect(centerLines).toBe(13);
  });

  test('4D Teseracto debe tener exactamente 272 líneas ganadoras', () => {
    const lines = getWinningLines(BoardType.TicTacToe4D);
    expect(lines.length).toBe(272);
    lines.forEach((line) => expect(line.length).toBe(3));

    // El hipercentro (1,1,1,1) debe estar atravesado por (3^4 - 1)/2 = 80/2 = 40 líneas ganadoras
    const hyperCenterLines = countWinningLinesPassingThrough({ x: 1, y: 1, z: 1, w: 1 }, BoardType.TicTacToe4D);
    expect(hyperCenterLines).toBe(40);
  });

  test('4x4 3D Qubic debe tener exactamente 76 líneas ganadoras de longitud 4', () => {
    const lines = getWinningLines(BoardType.TicTacToe4x4_3D);
    expect(lines.length).toBe(76);
    lines.forEach((line) => expect(line.length).toBe(4));

    // Cada esquina (ej. 0,0,0) debe estar en 7 líneas:
    // 3 axiales + 3 diagonales planas + 1 diagonal espacial = 7 líneas
    const cornerLines = countWinningLinesPassingThrough({ x: 0, y: 0, z: 0, w: 0 }, BoardType.TicTacToe4x4_3D);
    expect(cornerLines).toBe(7);

    // Cada celda central (ej. 1,1,1) debe estar en 7 líneas
    const centerLines = countWinningLinesPassingThrough({ x: 1, y: 1, z: 1, w: 0 }, BoardType.TicTacToe4x4_3D);
    expect(centerLines).toBe(7);
  });

  test('5x5 Libre debe tener exactamente 12 líneas ganadoras de longitud 5', () => {
    const lines = getWinningLines(BoardType.Connect5x5);
    expect(lines.length).toBe(12);
    lines.forEach((line) => expect(line.length).toBe(5));

    // El centro (2,2) debe estar atravesado por 4 líneas (1 fila, 1 col, 2 diagonales)
    const centerLines = countWinningLinesPassingThrough({ x: 2, y: 2, z: 0, w: 0 }, BoardType.Connect5x5);
    expect(centerLines).toBe(4);

    // Una esquina (0,0) debe estar atravesada por 3 líneas (1 fila, 1 col, 1 diagonal)
    const cornerLines = countWinningLinesPassingThrough({ x: 0, y: 0, z: 0, w: 0 }, BoardType.Connect5x5);
    expect(cornerLines).toBe(3);
  });
});
