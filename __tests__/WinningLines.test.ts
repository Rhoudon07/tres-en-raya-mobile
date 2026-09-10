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
});
