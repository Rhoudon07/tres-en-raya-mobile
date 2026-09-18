import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { PowerType, createInitialPlayerPowers } from '../src/types/powers';
import { getBestDecisionPowers, getBestMovePowers } from '../src/game/ai/MinimaxPowers';
import { Difficulty } from '../src/types/ai';

describe('Modalidad Poderes y Habilidades Tácticas (Powers3x3)', () => {
  test('Inicialización de BoardModel y métodos de poderes', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    expect(b.isPowers()).toBe(true);
    expect(b.gridSize).toBe(3);
    expect(b.winCondition).toBe(3);
  });

  test('Bomba (clearCell) y reversión con undoPower', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    const pos = { x: 1, y: 1, z: 0, w: 0 };

    // Intentar bomba en celda vacía falla
    expect(b.clearCell(pos)).toBe(false);

    // Colocar ficha y detonar bomba
    b.makeMove(pos, 'X');
    expect(b.getCell(pos)).toBe('X');
    expect(b.getOccupiedCount()).toBe(1);

    expect(b.clearCell(pos)).toBe(true);
    expect(b.getCell(pos)).toBe(' ');
    expect(b.getOccupiedCount()).toBe(0);

    // Reversión con undoPower
    expect(b.undoPower()).toBe(true);
    expect(b.getCell(pos)).toBe('X');
    expect(b.getOccupiedCount()).toBe(1);
  });

  test('Bloqueo territorial (setObstacleCell) y reversión con undoPower', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    const pos = { x: 0, y: 1, z: 0, w: 0 };

    expect(b.setObstacleCell(pos)).toBe(true);
    expect(b.getCell(pos)).toBe('#');
    expect(b.isCellBlocked(pos)).toBe(true);

    // No se puede volver a bloquear una celda ya bloqueada
    expect(b.setObstacleCell(pos)).toBe(false);

    // Reversión
    expect(b.undoPower()).toBe(true);
    expect(b.getCell(pos)).toBe(' ');
    expect(b.isCellBlocked(pos)).toBe(false);
  });

  test('Intercambio cuántico (swapCells) y reversión con undoPower', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    const posA = { x: 0, y: 0, z: 0, w: 0 };
    const posB = { x: 2, y: 2, z: 0, w: 0 };

    b.makeMove(posA, 'X');
    b.makeMove(posB, 'O');

    // Intercambiar
    expect(b.swapCells(posA, posB)).toBe(true);
    expect(b.getCell(posA)).toBe('O');
    expect(b.getCell(posB)).toBe('X');

    // Revertir
    expect(b.undoPower()).toBe(true);
    expect(b.getCell(posA)).toBe('X');
    expect(b.getCell(posB)).toBe('O');
  });

  test('IA de Poderes: Detección de jugada ganadora normal y uso de Doble Turno', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');

    const powers = createInitialPlayerPowers();
    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);

    // IA detecta victoria inmediata
    expect(decision.move).toEqual({ x: 0, y: 2, z: 0, w: 0 });

    const standardBest = getBestMovePowers(b, 'X', 'O', Difficulty.Hard);
    expect(standardBest).toEqual({ x: 0, y: 2, z: 0, w: 0 });
  });

  test('IA de Poderes: Detección de bloqueo de amenaza inminente del rival', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    // Humano O tiene (1,0) y (1,1)
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');

    const powers = createInitialPlayerPowers();
    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);

    // Debe bloquear en (1,2)
    expect(decision.move).toEqual({ x: 1, y: 2, z: 0, w: 0 });
  });
});
