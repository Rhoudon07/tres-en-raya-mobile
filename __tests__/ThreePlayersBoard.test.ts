import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import {
  getBestMoveThreePlayers,
  findWinningMoveThreePlayers,
  getOpponentsThreePlayers,
} from '../src/game/ai/MinimaxThreePlayers';
import { Difficulty } from '../src/types/ai';
import { getWinningLines } from '../src/game/board/WinningLines';
import { useGameStore } from '../src/stores/useGameStore';
import { GameMode, PlayerTurnOrder } from '../src/types/game';

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

describe('Modalidad Tres Jugadores 5x5 Simultáneo (ThreePlayers5x5 con 4 en Raya)', () => {
  test('Inicialización del tablero 5x5 y condición de 4 en raya', () => {
    const b = new BoardModel(BoardType.ThreePlayers5x5);
    expect(b.isThreePlayers()).toBe(true);
    expect(b.gridSize).toBe(5);
    expect(b.winCondition).toBe(4);
    expect(b.isFull()).toBe(false);
  });

  test('Exactamente 28 líneas ganadoras de longitud 4 en 5x5', () => {
    const lines = getWinningLines(BoardType.ThreePlayers5x5);
    expect(lines.length).toBe(28);
    for (const line of lines) {
      expect(line.length).toBe(4);
    }
  });

  test('Victoria con 4 en raya horizontal en 5x5', () => {
    const b = new BoardModel(BoardType.ThreePlayers5x5);
    // X conecta 4 en fila 0: (0,1), (0,2), (0,3), (0,4)
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'X');
    expect(b.checkWinner().winner).toBe(' ');

    b.makeMove({ x: 0, y: 4, z: 0, w: 0 }, 'X');
    const res = b.checkWinner();
    expect(res.winner).toBe('X');
    expect(res.winningLine?.length).toBe(4);
  });

  test('Victoria con 4 en raya diagonal para jugador Y en 5x5', () => {
    const b = new BoardModel(BoardType.ThreePlayers5x5);
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 3, y: 3, z: 0, w: 0 }, 'Y');
    b.makeMove({ x: 4, y: 4, z: 0, w: 0 }, 'Y');

    const res = b.checkWinner();
    expect(res.winner).toBe('Y');
    expect(res.winningLine).toEqual([
      { x: 1, y: 1, z: 0, w: 0 },
      { x: 2, y: 2, z: 0, w: 0 },
      { x: 3, y: 3, z: 0, w: 0 },
      { x: 4, y: 4, z: 0, w: 0 },
    ]);
  });

  test('IA 3 Jugadores en 5x5: Detecta y ejecuta victoria inmediata de 4 en raya', () => {
    const b = new BoardModel(BoardType.ThreePlayers5x5);
    // IA es 'O'. 'O' tiene (2,1), (2,2) y (2,3). La casilla (2,4) completa 4 en raya.
    b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 3, z: 0, w: 0 }, 'O');

    const winMove = findWinningMoveThreePlayers(b, 'O');
    expect(winMove).toBeDefined();

    const bestMove = getBestMoveThreePlayers(b, 'O', Difficulty.Hard);
    // Debe ganar completando en (2,0) o (2,4)
    expect(bestMove.x).toBe(2);
    expect([0, 4]).toContain(bestMove.y);
  });

  test('Mensaje de Derrota: En modo PvCPU muestra Derrota cuando gana la CPU', async () => {
    useGameStore.getState().setBoardType(BoardType.TicTacToe3x3);
    useGameStore.getState().startNewGame(GameMode.PvCPU, PlayerTurnOrder.First); // Humano es X, CPU es O

    // Humano hace jugadas en col 0
    await useGameStore.getState().playMove({ x: 0, y: 0, z: 0, w: 0 }); // X
    // CPU gana en fila 1: O en (1,0), (1,1), (1,2)
    const b = useGameStore.getState().board;
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    
    // CPU completa victoria en fila 1
    await useGameStore.getState().playMove({ x: 1, y: 2, z: 0, w: 0 }); // Turno O completando victoria

    const state = useGameStore.getState();
    expect(state.gameOver).toBe(true);
    expect(state.resultMessage).toBe('Derrota');
  });

  test('Mensaje en PvP: Muestra ¡Victoria para ...! y no Derrota', async () => {
    useGameStore.getState().setBoardType(BoardType.TicTacToe3x3);
    useGameStore.getState().startNewGame(GameMode.PvP);

    await useGameStore.getState().playMove({ x: 0, y: 0, z: 0, w: 0 }); // X
    await useGameStore.getState().playMove({ x: 1, y: 0, z: 0, w: 0 }); // O
    await useGameStore.getState().playMove({ x: 0, y: 1, z: 0, w: 0 }); // X
    await useGameStore.getState().playMove({ x: 1, y: 1, z: 0, w: 0 }); // O
    await useGameStore.getState().playMove({ x: 0, y: 2, z: 0, w: 0 }); // X completa victoria

    const state = useGameStore.getState();
    expect(state.gameOver).toBe(true);
    expect(state.resultMessage).toBe('¡Victoria para X!');
  });
});
