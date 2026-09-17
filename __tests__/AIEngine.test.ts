import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { Difficulty } from '../src/types/ai';
import { AIEngine } from '../src/game/ai/AIEngine';

describe('AIEngine & Difficulties (Portado de test_difficulties.cpp)', () => {
  test('3x3: En Hard detecta y ejecuta victoria inmediata', () => {
    const b = new BoardModel(BoardType.TicTacToe3x3);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('3x3: En Hard bloquea victoria inminente del adversario', () => {
    const b = new BoardModel(BoardType.TicTacToe3x3);
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 1, y: 2, z: 0, w: 0 });
  });

  test('4x4 Libre: En Hard completa 4 en línea servido', () => {
    const b = new BoardModel(BoardType.Connect4x4);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'O');

    const move = AIEngine.getBestMoveSync(b, 'O', 'X', Difficulty.Hard);
    expect(move).toEqual({ x: 0, y: 3, z: 0, w: 0 });
  });

  test('4x4 Gravedad: Respeta la fila más baja disponible y gana de inmediato', () => {
    const b = new BoardModel(BoardType.Gravity4x4);
    b.makeMove({ x: 3, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    // Debe ganar en la columna 1 (fila 0)
    expect(move).toEqual({ x: 0, y: 1, z: 0, w: 0 });
  });

  test('3D Qubic: En Hard toma el centro (1,1,1) al iniciar', () => {
    const b = new BoardModel(BoardType.TicTacToe3D);
    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 1, y: 1, z: 1, w: 0 });
  });

  test('4D Teseracto: En Hard completa hiperdiagonal (0,0,0,0) - (1,1,1,1) -> (2,2,2,2)', () => {
    const b = new BoardModel(BoardType.TicTacToe4D);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 1, w: 1 }, 'O');

    const move = AIEngine.getBestMoveSync(b, 'O', 'X', Difficulty.Hard);
    expect(move).toEqual({ x: 2, y: 2, z: 2, w: 2 });
  });

  test('4x4 3D: En Hard completa victoria inmediata de 4 en raya espacial', () => {
    const b = new BoardModel(BoardType.TicTacToe4x4_3D);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 1, w: 0 }, 'X');
    b.makeMove({ x: 2, y: 2, z: 2, w: 0 }, 'X');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 3, y: 3, z: 3, w: 0 });
  });

  test('4x4 3D: En Hard bloquea victoria inminente del adversario en pilar vertical', () => {
    const b = new BoardModel(BoardType.TicTacToe4x4_3D);
    b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 2, z: 1, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 2, z: 2, w: 0 }, 'O');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 2, y: 2, z: 3, w: 0 });
  });

  test('5x5 Libre: En Hard toma el centro (2,2) en apertura inicial con tablero vacío', () => {
    const b = new BoardModel(BoardType.Connect5x5);
    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 2, y: 2, z: 0, w: 0 });
  });

  test('5x5 Libre: En Hard completa victoria inmediata de 5 en raya', () => {
    const b = new BoardModel(BoardType.Connect5x5);
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 1, y: 3, z: 0, w: 0 }, 'X');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 1, y: 4, z: 0, w: 0 });
  });

  test('5x5 Libre: En Hard bloquea victoria inminente del adversario', () => {
    const b = new BoardModel(BoardType.Connect5x5);
    b.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 3, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 3, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 3, y: 3, z: 0, w: 0 }, 'O');

    const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
    expect(move).toEqual({ x: 4, y: 3, z: 0, w: 0 });
  });
});
