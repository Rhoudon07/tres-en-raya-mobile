import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import { PowerType, createInitialPlayerPowers, markPlayerPowerUsed } from '../src/types/powers';
import { getBestDecisionPowers, getBestMovePowers } from '../src/game/ai/MinimaxPowers';
import { Difficulty } from '../src/types/ai';

describe('Modalidad Poderes y Habilidades Tácticas (Powers3x3 -> 5x5 con Habilidades)', () => {
  test('Inicialización de BoardModel y métodos de poderes en 5x5', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    expect(b.isPowers()).toBe(true);
    expect(b.gridSize).toBe(5);
    expect(b.winCondition).toBe(5);
  });

  test('Bomba (clearCell) y reversión con undoPower', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    const pos = { x: 2, y: 2, z: 0, w: 0 };

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
    const posB = { x: 4, y: 4, z: 0, w: 0 };

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
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'X');

    const powers = createInitialPlayerPowers();
    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);

    // IA detecta victoria inmediata
    expect(decision.move).toEqual({ x: 0, y: 4, z: 0, w: 0 });

    const standardBest = getBestMovePowers(b, 'X', 'O', Difficulty.Hard);
    expect(standardBest).toEqual({ x: 0, y: 4, z: 0, w: 0 });
  });

  test('IA de Poderes: Detección de bloqueo de amenaza inminente del rival', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    // Humano O tiene (1,0), (1,1), (1,2) y (1,3)
    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 1, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 2, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 3, z: 0, w: 0 }, 'O');

    const powers = createInitialPlayerPowers();
    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);

    // Debe bloquear en (1,4)
    expect(decision.move).toEqual({ x: 1, y: 4, z: 0, w: 0 });
  });

  test('markPlayerPowerUsed marca todas las habilidades como gastadas y establece usedPower', () => {
    const powers = createInitialPlayerPowers();
    expect(powers.hasUsedPower).toBe(false);
    expect(powers.usedPower).toBeNull();
    expect(powers.bombUsed).toBe(false);

    const updated = markPlayerPowerUsed(powers, PowerType.Bomb);
    expect(updated.hasUsedPower).toBe(true);
    expect(updated.usedPower).toBe(PowerType.Bomb);
    expect(updated.bombUsed).toBe(true);
    expect(updated.doubleTurnUsed).toBe(true);
    expect(updated.blockCellUsed).toBe(true);
    expect(updated.swapUsed).toBe(true);
  });

  test('IA de Poderes: Detección de victoria fulminante con Swap', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    // X (IA) tiene (0,0), (0,1), (0,2) y (0,3). En (0,4) hay una ficha de O!
    // Y la IA tiene una ficha aislada en (1,4)
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 4, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 1, y: 4, z: 0, w: 0 }, 'X');

    const powers = createInitialPlayerPowers();
    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);

    // La IA debe detectar que intercambiando (1,4) con (0,4) gana inmediatamente en fila 0
    expect(decision.powerToUse).toBe(PowerType.Swap);
    expect(decision.powerTarget).toEqual({ x: 1, y: 4, z: 0, w: 0 });
    expect(decision.powerTargetB).toEqual({ x: 0, y: 4, z: 0, w: 0 });
  });

  test('IA de Poderes: Desarmar horquilla (fork) del rival usando Bomba', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    // O (Humano) tiene horquilla con fila 0 amenazando (0,4) y columna 0 amenazando (4,0)
    // El punto de intersección es (0,0)
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'O');

    b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'O');
    b.makeMove({ x: 3, y: 0, z: 0, w: 0 }, 'O');

    // IA tiene ficha en (4,4)
    b.makeMove({ x: 4, y: 4, z: 0, w: 0 }, 'X');

    const powers = createInitialPlayerPowers();
    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);

    // Debe usar Bomba sobre (0,0) para desactivar ambas amenazas simultáneas
    expect(decision.powerToUse).toBe(PowerType.Bomb);
    expect(decision.powerTarget).toEqual({ x: 0, y: 0, z: 0, w: 0 });
  });

  test('IA de Poderes: Si la habilidad ya fue usada, no usa más habilidades', () => {
    const b = new BoardModel(BoardType.Powers3x3);
    b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 1, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 2, z: 0, w: 0 }, 'X');
    b.makeMove({ x: 0, y: 3, z: 0, w: 0 }, 'X');

    let powers = createInitialPlayerPowers();
    powers = markPlayerPowerUsed(powers, PowerType.BlockCell);

    const decision = getBestDecisionPowers(b, 'X', 'O', powers, Difficulty.Hard);
    // Gana normalmente sin usar poder
    expect(decision.powerToUse).toBeUndefined();
    expect(decision.move).toEqual({ x: 0, y: 4, z: 0, w: 0 });
  });
});
