import { BoardModel } from '../src/game/board/BoardModel';
import { BoardType } from '../src/types/board';
import {
  CustomGameRules,
  createDefaultCustomRules,
  serializeRules,
  deserializeRules,
} from '../src/types/lab';

describe('Modo Laboratorio / Sandbox (BoardType.Custom y Semillas)', () => {
  test('Serialización y deserialización de reglas mediante Semillas', () => {
    const rules: CustomGameRules = {
      dimension: '4x4',
      winCondition: 4,
      gravity: true,
      limitedPieces: 4,
      misere: true,
      obstacles: 3,
      turnTimer: 10,
      playerCount: 3,
    };

    const seed = serializeRules(rules);
    expect(seed).toBe('LAB-4x4-W4-G1-L4-M1-O3-T10-P3');

    const parsed = deserializeRules(seed);
    expect(parsed).toEqual(rules);

    // Semillas corruptas o inválidas
    expect(deserializeRules('')).toBeNull();
    expect(deserializeRules('INVALID-CODE')).toBeNull();
    expect(deserializeRules('LAB-2x2-W3-G0-L0-M0-O0-T0-P2')).toBeNull(); // Dimensión inválida
  });

  test('Inicialización de BoardModel con reglas personalizadas 4x4 con gravedad', () => {
    const rules: CustomGameRules = {
      dimension: '4x4',
      winCondition: 4,
      gravity: true,
      limitedPieces: 0,
      misere: false,
      obstacles: 0,
      turnTimer: 0,
      playerCount: 2,
    };

    const b = new BoardModel(BoardType.Custom, rules);
    expect(b.gridSize).toBe(4);
    expect(b.winCondition).toBe(4);
    expect(b.hasGravity()).toBe(true);
    expect(b.isMisere()).toBe(false);
    expect(b.isFull()).toBe(false);

    // Comprobar que la gravedad funciona
    expect(b.getLowestAvailableRow(0)).toBe(3);
    b.makeMove({ x: 3, y: 0, z: 0, w: 0 }, 'X');
    expect(b.getLowestAvailableRow(0)).toBe(2);
  });

  test('Reglas personalizadas con obstáculos y victoria Misère', () => {
    const rules: CustomGameRules = {
      dimension: '3x3',
      winCondition: 3,
      gravity: false,
      limitedPieces: 0,
      misere: true, // ¡Quien hace 3 en raya pierde!
      obstacles: 2,
      turnTimer: 5,
      playerCount: 2,
    };

    const b = new BoardModel(BoardType.Custom, rules);
    expect(b.isObstacles()).toBe(true);
    expect(b.isMisere()).toBe(true);
    expect(b.isTimeAttack()).toBe(true);
    expect(b.getOccupiedCount()).toBe(2); // 2 obstáculos generados

    // X alinea 3 en la columna 0 (libre de obstáculos) -> ¡X PIERDE y gana O por regla Misère!
    expect(b.makeMove({ x: 0, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
    expect(b.makeMove({ x: 1, y: 0, z: 0, w: 0 }, 'X')).toBe(true);
    expect(b.makeMove({ x: 2, y: 0, z: 0, w: 0 }, 'X')).toBe(true);

    const res = b.checkWinner();
    expect(res.winner).toBe('O');
  });

  test('Reglas personalizadas con 3 jugadores en 5x5', () => {
    const rules: CustomGameRules = {
      dimension: '5x5',
      winCondition: 5,
      gravity: false,
      limitedPieces: 0,
      misere: false,
      obstacles: 0,
      turnTimer: 0,
      playerCount: 3,
    };

    const b = new BoardModel(BoardType.Custom, rules);
    expect(b.gridSize).toBe(5);
    expect(b.winCondition).toBe(5);
    expect(b.isThreePlayers()).toBe(true);

    // Conectar 5 con Y en la diagonal
    for (let i = 0; i < 5; i++) {
      b.makeMove({ x: i, y: i, z: 0, w: 0 }, 'Y');
    }

    const res = b.checkWinner();
    expect(res.winner).toBe('Y');
  });
});
