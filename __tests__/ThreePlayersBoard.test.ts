import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import {
  getBestMoveThreePlayers,
  findWinningMoveThreePlayers,
  getOpponentsThreePlayers,
} from '../src/game/ai/MinimaxThreePlayers';
import { Difficulty } from '../src/types/ai';

describe('Modalidad Tres Jugadores (ThreePlayers3x3)', () => {
  test('Inicialización correcta del tablero', () => {
    const b = new BoardModel(BoardType.ThreePlayers3x3);
    expect(b.isThreePlayers()).toBe(true);
    expect(b.gridSize).toBe(3);
    expect(b.winCondition).toBe(3);
    expect(b.isFull()).toBe(false);
    expect(b.getOccupiedCount()).toBe(0);
  });

  test('Alternancia de símbolos y victoria de Y', () => {
    const b = new BoardModel(BoardType.ThreePlayers3x3);

    // Ronda 1:
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'Y');

    // Ronda 2:
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'Y');

    // Ronda 3: X y O no completan línea, Y completa la fila 2
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X'); // X completa fila 0
    let res = b.checkWinner();
    expect(res.winner).toBe('X');
    expect(res.winningLine?.length).toBe(3);

    // Reiniciar y probar victoria directa de Y
    b.reset();
    b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'Y');
    res = b.checkWinner();
    expect(res.winner).toBe('Y');
    expect(res.winningLine).toEqual([
      { x: 2, y: 0, z: 0, w: 0 },
      { x: 2, y: 1, z: 0, w: 0 },
      { x: 2, y: 2, z: 0, w: 0 },
    ]);
  });

  test('Detección de empate en 3 jugadores (9 casillas ocupadas sin 3 en raya)', () => {
    const b = new BoardModel(BoardType.ThreePlayers3x3);
    // Tablero en empate válido (3 fichas de cada uno, 0 líneas ganadoras):
    // X X O
    // O O Y
    // Y Y X
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'O');

    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'Y');

    b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X');

    expect(b.isFull()).toBe(true);
    const res = b.checkWinner();
    expect(res.winner).toBe('D');
  });

  test('IA Tres Jugadores: Detección de orden de oponentes', () => {
    expect(getOpponentsThreePlayers('X')).toEqual({ nextOpponent: 'O', thirdOpponent: 'Y' });
    expect(getOpponentsThreePlayers('O')).toEqual({ nextOpponent: 'Y', thirdOpponent: 'X' });
    expect(getOpponentsThreePlayers('Y')).toEqual({ nextOpponent: 'X', thirdOpponent: 'O' });
  });

  test('IA Tres Jugadores: Ejecuta victoria inmediata', () => {
    const b = new BoardModel(BoardType.ThreePlayers3x3);
    // IA es 'Y'. 'Y' tiene (0,0) y (0,1).
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'Y');

    const winMove = findWinningMoveThreePlayers(b, 'Y');
    expect(winMove).toEqual({ x: 0, y: 2, z: 0, w: 0 });

    const bestMove = getBestMoveThreePlayers(b, 'Y', Difficulty.Hard);
    expect(bestMove).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('IA Tres Jugadores: Bloquea amenaza urgente del siguiente oponente', () => {
    const b = new BoardModel(BoardType.ThreePlayers3x3);
    // IA es 'X'. Siguiente oponente es 'O'.
    // 'O' tiene (1,0) y (1,1). Si 'X' no bloquea en (1,2), 'O' ganará en su turno.
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

    const bestMove = getBestMoveThreePlayers(b, 'X', Difficulty.Hard);
    expect(bestMove).toEqual({ x: 1, y: 2, z: 0, w: 0 });
  });
});
