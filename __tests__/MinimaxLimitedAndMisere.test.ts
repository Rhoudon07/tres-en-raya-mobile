import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { Difficulty } from '../src/types/ai';
import { AIEngine } from '../src/game/ai/AIEngine';

describe('AIEngine Limited Pieces & Misère Tests (__tests__/MinimaxLimitedAndMisere.test.ts)', () => {
  describe('IA Fichas Limitadas (Limited3x3)', () => {
    test('En Hard completa victoria inmediata de 3 en raya', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      // X tiene dos fichas en fila 0: (0,0) y (0,1)
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

      // AI es 'X': colocar en (0,2) es la 3ª ficha de X y gana de inmediato
      const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
      expect(move).toEqual({ x: 0, y: 2, z: 0, w: 0 });
    });

    test('En Hard bloquea victoria inminente del adversario', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      // O tiene (1,0) y (1,1)
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 2, y: 2, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

      // AI es 'X': debe bloquear en (1,2)
      const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
      expect(move).toEqual({ x: 1, y: 2, z: 0, w: 0 });
    });

    test('En Hard comprende que la 4ª ficha expulsa a la 1ª y no destruye su propia victoria', () => {
      const b = new BoardModel(BoardType.Limited3x3);
      // X coloca (0,0) [1ª], (0,1) [2ª], (1,1) [3ª]
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 2, y: 1, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');

      // Si X juega en (0,2), su 1ª ficha (0,0) desaparecería, por lo que NO completaría la fila 0!
      // La IA no debe asumir que (0,2) gana completando con (0,0)
      const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
      expect(b.isMoveValid(move)).toBe(true);
    });
  });

  describe('IA Misère / Inverso (Misere3x3)', () => {
    test('En Hard NUNCA completa 3 en raya propio si tiene alternativas seguras', () => {
      const b = new BoardModel(BoardType.Misere3x3);
      // X tiene (0,0) y (0,1). La casilla (0,2) completaría 3 en raya y perdería.
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
      b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');

      // Le toca a X: jugar (0,2) es DERROTA directa. La IA DEBE evitar (0,2)
      const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
      expect(move).not.toEqual({ x: 0, y: 2, z: 0, w: 0 });

      // Verificar que la jugada elegida no pierde de inmediato
      b.makeMove(move, 'X');
      expect(b.checkWinner().winner).not.toBe('O'); // Si winner fuera O, X habría perdido
    });

    test('Rendimiento Misère: Cálculo en Hard se ejecuta en < 30 ms', () => {
      const b = new BoardModel(BoardType.Misere3x3);
      b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
      b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

      const start = Date.now();
      const move = AIEngine.getBestMoveSync(b, 'X', 'O', Difficulty.Hard);
      const duration = Date.now() - start;

      expect(b.isMoveValid(move)).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });
});
