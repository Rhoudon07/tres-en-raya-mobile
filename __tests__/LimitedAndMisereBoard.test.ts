import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';

describe('Limited3x3 and Misere3x3 Board Rules (__tests__/LimitedAndMisereBoard.test.ts)', () => {
  describe('Fichas Limitadas (Limited3x3)', () => {
    test('Cada jugador puede colocar hasta 3 fichas normalmente', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      expect(b.isLimited()).toBe(true);

      expect(b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
      expect(b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O')).toBe(true);
      expect(b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X')).toBe(true);
      expect(b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O')).toBe(true);
      expect(b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
      expect(b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O')).toBe(true);

      // X y O tienen 3 fichas cada uno
      expect(b.pieceQueues.X.length).toBe(3);
      expect(b.pieceQueues.O.length).toBe(3);
      expect(b.getOccupiedCount()).toBe(6);

      // getExpiringPiece indica que la ficha más antigua de X es (0,0)
      expect(b.getExpiringPiece('X')).toEqual({ x: 0, y: 0, z: 0, w: 0 });
      // y la de O es (1,0)
      expect(b.getExpiringPiece('O')).toEqual({ x: 1, y: 0, z: 0, w: 0 });
    });

    test('Al colocar la 4ª ficha, la ficha propia más antigua desaparece', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X'); // 1ª de X
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X'); // 2ª de X
      b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'X'); // 3ª de X
      b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O');

      // (0,0) está ocupada por X
      expect(b.getCell2D(0, 0)).toBe('X');

      // X coloca su 4ª ficha en (2,2)
      expect(b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X')).toBe(true);

      // La 1ª ficha de X en (0,0) debe haber desaparecido y quedar vacía
      expect(b.getCell2D(0, 0)).toBe(' ');
      // La nueva ficha en (2,2) está presente
      expect(b.getCell2D(2, 2)).toBe('X');
      // X mantiene exactamente 3 fichas
      expect(b.pieceQueues.X.length).toBe(3);
      // Ahora la ficha más antigua de X es (0,1)
      expect(b.getExpiringPiece('X')).toEqual({ x: 0, y: 1, z: 0, w: 0 });
    });

    test('undoMove restaura la ficha eliminada de la cola en Fichas Limitadas', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X');

      // 4ª jugada de X en (1,1) expulsa (0,0)
      const move4 = { x: 1, y: 1, z: 0, w: 0 };
      b.makeMove(move4, 'X');
      expect(b.getCell2D(0, 0)).toBe(' ');

      // Deshacer move4
      b.undoMove(move4);
      expect(b.getCell2D(1, 1)).toBe(' ');
      expect(b.getCell2D(0, 0)).toBe('X'); // restaurada!
      expect(b.pieceQueues.X.length).toBe(3);
      expect(b.pieceQueues.X[0]).toEqual({ x: 0, y: 0, z: 0, w: 0 });
    });

    test('Victoria en Fichas Limitadas cuando las 3 fichas vigentes se alinean', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      // Colocamos X en (0,0), (1,0) y (2,1)
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'X'); // 3ª de X (no alineada)
      b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'O');

      expect(b.checkWinner().winner).toBe(' ');

      // X coloca su 4ª ficha en (2,0):
      // Esto elimina la 1ª ficha de X (0,0) -> las fichas vigentes de X quedan en (1,0), (2,1), (2,0) (no gana)
      // Pero si X coloca en (2,0) y su 1ª era (2,1)...
      // Probemos alineando las 3 fichas:
      const b2 = new BoardModel(BoardType.Limited3x3);
      b2.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X'); // 1
      b2.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X'); // 2
      b2.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X'); // 3 -> ¡3 en raya inmediato!
      expect(b2.checkWinner().winner).toBe('X');
    });
  });

  describe('Misère / Inverso (Misere3x3)', () => {
    test('Quien forma 3 en raya pierde: gana el rival', () => {
      const b = new BoardModel(BoardType.Misere3x3);
      expect(b.isMisere()).toBe(true);

      // X forma 3 en raya en la fila 0: (0,0), (0,1), (0,2)
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X'); // X completa 3 en raya

      // En Misère, como X completó la línea, X PIERDE y O GANA
      const res = b.checkWinner();
      expect(res.winner).toBe('O');
      expect(res.winningLine?.length).toBe(3);
    });

    test('Detección de empate en Misère cuando el tablero se llena sin líneas', () => {
      const b = new BoardModel(BoardType.Misere3x3);
      // Tablero lleno sin 3 en raya:
      // X O X
      // X O O
      // O X X
      const drawMoves: [number, number, 'X' | 'O'][] = [
        [0, 0, 'X'], [0, 1, 'O'], [0, 2, 'X'],
        [1, 0, 'X'], [1, 1, 'O'], [1, 2, 'O'],
        [2, 0, 'O'], [2, 1, 'X'], [2, 2, 'X'],
      ];
      drawMoves.forEach(([r, c, s]) => b.makeMove({ x: r, y: c, z: 0, w: 0 }, s));

      expect(b.isFull()).toBe(true);
      expect(b.checkWinner().winner).toBe('D');
    });
  });
});
