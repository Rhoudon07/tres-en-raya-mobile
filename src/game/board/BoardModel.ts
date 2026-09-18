import { BoardType, CellSymbol, Vector4i, MovementMove } from '../../types/board';
import {
  getWinningLines,
  getWinningLineIndices,
  getWinningLinesForDimension,
  getWinningLineIndicesForDimension,
  coordToIndex,
} from './WinningLines';
import { CustomGameRules } from '../../types/lab';

/**
 * Modelo de datos puro del tablero con alta optimización de rendimiento.
 * Utiliza un array lineal contiguo en memoria con indexación aritmética O(1)
 * libre de asignaciones de strings en cada ciclo de Minimax.
 */
interface UndoEntry {
  activeMacro?: number | null;
  prevMacroWinner?: CellSymbol | 'D';
  macroIdx?: number;
  limitedRemoved?: Vector4i | null;
  limitedSymbol?: CellSymbol;
  movementFrom?: Vector4i;
  movementTo?: Vector4i;
  movementPlacement?: Vector4i;
  movementSymbol?: CellSymbol;
  powerType?: 'bomb' | 'block' | 'swap';
  bombPos?: Vector4i;
  bombPrevSymbol?: CellSymbol;
  blockPos?: Vector4i;
  swapPosA?: Vector4i;
  swapSymbolA?: CellSymbol;
  swapPosB?: Vector4i;
  swapSymbolB?: CellSymbol;
}

export class BoardModel {
  public readonly type: BoardType;
  public readonly gridSize: number;
  public readonly winCondition: number;
  public readonly customRules?: CustomGameRules;

  // Representación interna en array lineal plano de 300 elementos:
  // idx = x + y*5 + z*25 + w*100
  private cells: CellSymbol[];
  private occupiedCount: number;

  // Propiedades exclusivas para Ultimate Tic-Tac-Toe (9 mini-tableros 3x3)
  public activeMacro: number | null;
  public macroBoard: (CellSymbol | 'D')[];

  // Propiedades exclusivas para Fichas Limitadas (máximo 3 fichas por jugador)
  public pieceQueues: { X: Vector4i[]; O: Vector4i[] };

  public obstacles?: Vector4i[];

  private undoStack: UndoEntry[];

  constructor(
    type: BoardType = BoardType.TicTacToe3x3,
    customRules?: CustomGameRules,
    obstacles?: Vector4i[]
  ) {
    this.type = type;
    this.customRules = customRules;
    this.cells = new Array(300).fill(' ');
    this.occupiedCount = 0;
    this.activeMacro = null;
    this.macroBoard = new Array(9).fill(' ');
    this.pieceQueues = { X: [], O: [] };
    this.undoStack = [];

    if (type === BoardType.Custom && customRules) {
      if (customRules.dimension === '5x5') {
        this.gridSize = 5;
      } else if (customRules.dimension === '4x4') {
        this.gridSize = 4;
      } else {
        this.gridSize = 3;
      }
      this.winCondition = customRules.winCondition;
      if (customRules.obstacles > 0) {
        this.initCustomObstacles(customRules.obstacles);
      }
    } else if (type === BoardType.Connect5x5 || type === BoardType.Powers3x3) {
      this.gridSize = 5;
      this.winCondition = 5;
    } else if (type === BoardType.ThreePlayers5x5) {
      this.gridSize = 5;
      this.winCondition = 4;
    } else if (
      type === BoardType.Connect4x4 ||
      type === BoardType.Gravity4x4 ||
      type === BoardType.TicTacToe4x4_3D ||
      type === BoardType.Obstacles4x4
    ) {
      this.gridSize = 4;
      this.winCondition = 4;
    } else {
      this.gridSize = 3;
      this.winCondition = 3;
    }

    if (type === BoardType.Obstacles4x4) {
      this.obstacles = obstacles || BoardModel.generateRandomObstacles4x4(2);
      this.initObstacles(this.obstacles);
    }
  }

  public hasGravity(): boolean {
    if (this.type === BoardType.Custom) return !!this.customRules?.gravity;
    return this.type === BoardType.Gravity4x4;
  }

  public is3D(): boolean {
    if (this.type === BoardType.Custom) return this.customRules?.dimension === '3D';
    return this.type === BoardType.TicTacToe3D || this.type === BoardType.TicTacToe4x4_3D;
  }

  public is4D(): boolean {
    if (this.type === BoardType.Custom) return this.customRules?.dimension === '4D';
    return this.type === BoardType.TicTacToe4D;
  }

  public isUltimate(): boolean {
    return this.type === BoardType.Ultimate;
  }

  public isLimited(): boolean {
    if (this.type === BoardType.Custom) return (this.customRules?.limitedPieces || 0) > 0;
    return this.type === BoardType.Limited3x3;
  }

  public isMisere(): boolean {
    if (this.type === BoardType.Custom) return !!this.customRules?.misere;
    return this.type === BoardType.Misere3x3;
  }

  public isMovement(): boolean {
    return this.type === BoardType.Movement3x3;
  }

  public isTimeAttack(): boolean {
    if (this.type === BoardType.Custom) return (this.customRules?.turnTimer || 0) > 0;
    return this.type === BoardType.TimeAttack3x3;
  }

  public isObstacles(): boolean {
    if (this.type === BoardType.Custom) return (this.customRules?.obstacles || 0) > 0;
    return this.type === BoardType.Obstacles4x4;
  }

  public isThreePlayers(): boolean {
    if (this.type === BoardType.Custom) return this.customRules?.playerCount === 3;
    return this.type === BoardType.ThreePlayers3x3 || this.type === BoardType.ThreePlayers5x5;
  }

  public isPowers(): boolean {
    return this.type === BoardType.Powers3x3;
  }

  public initCustomObstacles(count: number): void {
    const fixedSpots: Vector4i[] = [
      { x: 0, y: 1, z: 0, w: 0 },
      { x: 2, y: 1, z: 0, w: 0 },
      { x: 1, y: 0, z: 0, w: 0 },
      { x: 1, y: 2, z: 0, w: 0 },
      { x: 0, y: 0, z: 0, w: 0 },
    ];
    for (let i = 0; i < Math.min(count, fixedSpots.length); i++) {
      const p = fixedSpots[i];
      if (p.x < this.gridSize && p.y < this.gridSize) {
        const idx = p.x + p.y * 5;
        if (this.cells[idx] === ' ') {
          this.cells[idx] = '#';
          this.occupiedCount++;
        }
      }
    }
  }

  public static readonly DEFAULT_OBSTACLES: Vector4i[] = [
    { x: 0, y: 0, z: 0, w: 0 },
    { x: 3, y: 3, z: 0, w: 0 },
  ];

  public static generateRandomObstacles4x4(count: number = 2): Vector4i[] {
    const obstacles: Vector4i[] = [];
    const usedIndices = new Set<number>();
    while (obstacles.length < count) {
      const idx = Math.floor(Math.random() * 16);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        const r = idx % 4;
        const c = Math.floor(idx / 4);
        obstacles.push({ x: r, y: c, z: 0, w: 0 });
      }
    }
    return obstacles;
  }

  public isCellBlocked(pos: Vector4i): boolean {
    return this.getCell(pos) === '#';
  }

  public initObstacles(obstacles: Vector4i[] = BoardModel.DEFAULT_OBSTACLES): void {
    for (const obs of obstacles) {
      const idx = obs.x + obs.y * 5;
      if (this.cells[idx] === ' ') {
        this.cells[idx] = '#';
        this.occupiedCount++;
      }
    }
  }

  public getPieceCount(symbol: CellSymbol): number {
    let count = 0;
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (this.cells[r + c * 5] === symbol) count++;
      }
    }
    return count;
  }

  public getPieces(symbol: CellSymbol): Vector4i[] {
    const pieces: Vector4i[] = [];
    for (let r = 0; r < this.gridSize; ++r) {
      for (let c = 0; c < this.gridSize; ++c) {
        if (this.cells[r + c * 5] === symbol) {
          pieces.push({ x: r, y: c, z: 0, w: 0 });
        }
      }
    }
    return pieces;
  }

  public isMovementPhase(): boolean {
    return this.isMovement() && this.getPieceCount('X') >= 3 && this.getPieceCount('O') >= 3;
  }

  public isAdjacent(from: Vector4i, to: Vector4i): boolean {
    const dx = Math.abs(from.x - to.x);
    const dy = Math.abs(from.y - to.y);
    return Math.max(dx, dy) === 1 && from.z === to.z && from.w === to.w;
  }

  public getValidPieceDestinations(from: Vector4i): Vector4i[] {
    if (!this.isMovement()) return [];
    const valid: Vector4i[] = [];
    for (let dx = -1; dx <= 1; ++dx) {
      for (let dy = -1; dy <= 1; ++dy) {
        if (dx === 0 && dy === 0) continue;
        const nx = from.x + dx;
        const ny = from.y + dy;
        if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) {
          const toPos: Vector4i = { x: nx, y: ny, z: 0, w: 0 };
          if (this.isCellEmpty(toPos)) {
            valid.push(toPos);
          }
        }
      }
    }
    return valid;
  }

  public getValidPieceMoves(symbol: CellSymbol): MovementMove[] {
    if (!this.isMovement()) return [];
    const moves: MovementMove[] = [];
    const pieces = this.getPieces(symbol);
    for (const piece of pieces) {
      const dests = this.getValidPieceDestinations(piece);
      for (const to of dests) {
        moves.push({ from: piece, to });
      }
    }
    return moves;
  }

  public movePiece(from: Vector4i, to: Vector4i, symbol: CellSymbol): boolean {
    if (!this.isMovement()) return false;
    if (this.getCell(from) !== symbol) return false;
    if (!this.isCellEmpty(to)) return false;
    if (!this.isAdjacent(from, to)) return false;

    const fromIdx = from.x + from.y * 5;
    const toIdx = to.x + to.y * 5;

    this.cells[fromIdx] = ' ';
    this.cells[toIdx] = symbol;

    this.undoStack.push({
      movementFrom: from,
      movementTo: to,
      movementSymbol: symbol,
    });

    return true;
  }

  public undoPieceMove(): boolean {
    const last = this.undoStack[this.undoStack.length - 1];
    if (last && last.movementFrom && last.movementTo && last.movementSymbol) {
      this.undoStack.pop();
      const fromIdx = last.movementFrom.x + last.movementFrom.y * 5;
      const toIdx = last.movementTo.x + last.movementTo.y * 5;
      this.cells[toIdx] = ' ';
      this.cells[fromIdx] = last.movementSymbol;
      return true;
    }
    return false;
  }

  public getExpiringPiece(symbol: CellSymbol): Vector4i | null {
    if (!this.isLimited()) return null;
    if (symbol === 'X' && this.pieceQueues.X.length >= 3) {
      return this.pieceQueues.X[0];
    }
    if (symbol === 'O' && this.pieceQueues.O.length >= 3) {
      return this.pieceQueues.O[0];
    }
    return null;
  }

  // --- MÉTODOS DE MODALIDAD PODERES ---

  public clearCell(pos: Vector4i): boolean {
    const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
    const current = this.cells[idx];
    if (current === ' ' || current === '#') return false;

    this.cells[idx] = ' ';
    this.occupiedCount--;
    this.undoStack.push({
      powerType: 'bomb',
      bombPos: pos,
      bombPrevSymbol: current,
    });
    return true;
  }

  public setObstacleCell(pos: Vector4i): boolean {
    const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
    if (this.cells[idx] !== ' ') return false;

    this.cells[idx] = '#';
    this.occupiedCount++;
    this.undoStack.push({
      powerType: 'block',
      blockPos: pos,
    });
    return true;
  }

  public swapCells(posA: Vector4i, posB: Vector4i): boolean {
    const idxA = posA.x + posA.y * 5 + posA.z * 25 + posA.w * 100;
    const idxB = posB.x + posB.y * 5 + posB.z * 25 + posB.w * 100;
    const symA = this.cells[idxA];
    const symB = this.cells[idxB];

    if (symA === ' ' || symA === '#' || symB === ' ' || symB === '#') return false;
    if (symA === symB) return false;

    this.cells[idxA] = symB;
    this.cells[idxB] = symA;
    this.undoStack.push({
      powerType: 'swap',
      swapPosA: posA,
      swapSymbolA: symA,
      swapPosB: posB,
      swapSymbolB: symB,
    });
    return true;
  }

  public undoPower(): boolean {
    const last = this.undoStack[this.undoStack.length - 1];
    if (!last || !last.powerType) return false;
    this.undoStack.pop();

    if (last.powerType === 'bomb' && last.bombPos && last.bombPrevSymbol) {
      const idx = last.bombPos.x + last.bombPos.y * 5 + last.bombPos.z * 25 + last.bombPos.w * 100;
      this.cells[idx] = last.bombPrevSymbol;
      this.occupiedCount++;
      return true;
    }

    if (last.powerType === 'block' && last.blockPos) {
      const idx = last.blockPos.x + last.blockPos.y * 5 + last.blockPos.z * 25 + last.blockPos.w * 100;
      this.cells[idx] = ' ';
      this.occupiedCount--;
      return true;
    }

    if (last.powerType === 'swap' && last.swapPosA && last.swapPosB && last.swapSymbolA && last.swapSymbolB) {
      const idxA = last.swapPosA.x + last.swapPosA.y * 5 + last.swapPosA.z * 25 + last.swapPosA.w * 100;
      const idxB = last.swapPosB.x + last.swapPosB.y * 5 + last.swapPosB.z * 25 + last.swapPosB.w * 100;
      this.cells[idxA] = last.swapSymbolA;
      this.cells[idxB] = last.swapSymbolB;
      return true;
    }

    return false;
  }

  public reset(): void {
    this.cells.fill(' ');
    this.occupiedCount = 0;
    this.undoStack = [];
    if (this.type === BoardType.Ultimate) {
      this.activeMacro = null;
      this.macroBoard = new Array(9).fill(' ');
    }
    if (this.type === BoardType.Limited3x3) {
      this.pieceQueues = { X: [], O: [] };
    }
    if (this.type === BoardType.Obstacles4x4) {
      this.initObstacles(this.obstacles);
    }
  }

  public getCell(pos: Vector4i): CellSymbol {
    return this.cells[pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100] || ' ';
  }

  public getCell2D(r: number, c: number): CellSymbol {
    return this.cells[r + c * 5] || ' ';
  }

  public getCell3D(r: number, c: number, z: number): CellSymbol {
    return this.cells[r + c * 5 + z * 25] || ' ';
  }

  public getCell4D(x: number, y: number, z: number, w: number): CellSymbol {
    return this.cells[x + y * 5 + z * 25 + w * 100] || ' ';
  }

  public isCellEmpty(pos: Vector4i): boolean {
    return this.cells[pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100] === ' ';
  }

  public isCellEmpty2D(r: number, c: number): boolean {
    return this.cells[r + c * 5] === ' ';
  }

  public isCellEmpty3D(r: number, c: number, z: number): boolean {
    return this.cells[r + c * 5 + z * 25] === ' ';
  }

  public isCellEmpty4D(x: number, y: number, z: number, w: number): boolean {
    return this.cells[x + y * 5 + z * 25 + w * 100] === ' ';
  }

  // --- MÉTODOS Y EVALUACIONES DE ULTIMATE TIC-TAC-TOE ---

  private static readonly MINI_3X3_LINES: [number, number, number][] = [
    [0, 5, 10], // fila 0 (x=0, y=0,1,2)
    [1, 6, 11], // fila 1 (x=1, y=0,1,2)
    [2, 7, 12], // fila 2 (x=2, y=0,1,2)
    [0, 1, 2],  // col 0 (x=0,1,2, y=0)
    [5, 6, 7],  // col 1 (x=0,1,2, y=1)
    [10, 11, 12], // col 2 (x=0,1,2, y=2)
    [0, 6, 12], // diag principal
    [2, 6, 10], // diag secundaria
  ];

  private static readonly MINI_CELL_OFFSETS: number[] = [
    0, 1, 2, 5, 6, 7, 10, 11, 12,
  ];

  public evaluateMiniBoard(macroIdx: number): CellSymbol {
    const base = (macroIdx % 3) * 25 + Math.floor(macroIdx / 3) * 100;
    for (const line of BoardModel.MINI_3X3_LINES) {
      const first = this.cells[base + line[0]];
      if (
        first !== ' ' &&
        this.cells[base + line[1]] === first &&
        this.cells[base + line[2]] === first
      ) {
        return first;
      }
    }
    return ' ';
  }

  public isMiniBoardFull(macroIdx: number): boolean {
    const base = (macroIdx % 3) * 25 + Math.floor(macroIdx / 3) * 100;
    for (let i = 0; i < 9; ++i) {
      if (this.cells[base + BoardModel.MINI_CELL_OFFSETS[i]] === ' ') {
        return false;
      }
    }
    return true;
  }

  public getMiniBoardWinner(macroIdx: number): CellSymbol | 'D' {
    return this.macroBoard[macroIdx] || ' ';
  }

  public getMiniBoardWinningLine(macroIdx: number): Vector4i[] | null {
    const base = (macroIdx % 3) * 25 + Math.floor(macroIdx / 3) * 100;
    const w = Math.floor(macroIdx / 3);
    const z = macroIdx % 3;
    const lineDefs = [
      [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
      [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
      [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
      [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
      [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
      [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }],
      [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
    ];
    for (let l = 0; l < BoardModel.MINI_3X3_LINES.length; ++l) {
      const line = BoardModel.MINI_3X3_LINES[l];
      const first = this.cells[base + line[0]];
      if (
        first !== ' ' &&
        this.cells[base + line[1]] === first &&
        this.cells[base + line[2]] === first
      ) {
        return lineDefs[l].map((pt) => ({ x: pt.x, y: pt.y, z, w }));
      }
    }
    return null;
  }

  public isMoveValid(pos: Vector4i): boolean {
    if (this.isMovement()) {
      if (this.isMovementPhase()) {
        return false;
      }
      return pos.x >= 0 && pos.x < 3 && pos.y >= 0 && pos.y < 3 && this.isCellEmpty(pos);
    }

    if (this.type === BoardType.Ultimate) {
      if (
        pos.x < 0 || pos.x >= 3 ||
        pos.y < 0 || pos.y >= 3 ||
        pos.z < 0 || pos.z >= 3 ||
        pos.w < 0 || pos.w >= 3
      ) {
        return false;
      }
      const macroIdx = pos.w * 3 + pos.z;
      if (this.activeMacro !== null && this.activeMacro !== macroIdx) {
        return false;
      }
      if (this.macroBoard[macroIdx] !== ' ') {
        return false;
      }
      const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
      return this.cells[idx] === ' ';
    }

    if (this.hasGravity()) {
      return pos.x === this.getLowestAvailableRow(pos.y) && this.isCellEmpty(pos);
    }

    return this.isCellEmpty(pos);
  }

  public getValidMoves(): Vector4i[] {
    if (this.isMovement() && this.isMovementPhase()) {
      return [];
    }

    if (this.type !== BoardType.Ultimate) {
      const moves: Vector4i[] = [];
      const maxZ =
        this.type === BoardType.TicTacToe4x4_3D ? 4 : this.is3D() || this.is4D() ? 3 : 1;
      const maxW = this.is4D() ? 3 : 1;
      for (let w = 0; w < maxW; ++w) {
        for (let z = 0; z < maxZ; ++z) {
          for (let r = 0; r < this.gridSize; ++r) {
            for (let c = 0; c < this.gridSize; ++c) {
              const p: Vector4i = { x: r, y: c, z, w };
              if (this.hasGravity()) {
                if (r === this.getLowestAvailableRow(c)) moves.push(p);
              } else if (this.isCellEmpty(p)) {
                moves.push(p);
              }
            }
          }
        }
      }
      return moves;
    }

    // Ultimate Tic-Tac-Toe
    const moves: Vector4i[] = [];
    const targetBoards: number[] = [];

    if (
      this.activeMacro !== null &&
      this.macroBoard[this.activeMacro] === ' ' &&
      !this.isMiniBoardFull(this.activeMacro)
    ) {
      targetBoards.push(this.activeMacro);
    } else {
      for (let m = 0; m < 9; ++m) {
        if (this.macroBoard[m] === ' ' && !this.isMiniBoardFull(m)) {
          targetBoards.push(m);
        }
      }
    }

    for (const m of targetBoards) {
      const w = Math.floor(m / 3);
      const z = m % 3;
      for (let x = 0; x < 3; ++x) {
        for (let y = 0; y < 3; ++y) {
          const p: Vector4i = { x, y, z, w };
          if (this.isCellEmpty(p)) {
            moves.push(p);
          }
        }
      }
    }
    return moves;
  }

  public makeMove(pos: Vector4i, symbol: CellSymbol): boolean {
    if (this.isMovement()) {
      if (this.isMovementPhase()) {
        return false;
      }
      if (this.getPieceCount(symbol) >= 3) {
        return false;
      }
      if (
        pos.x < 0 || pos.x >= 3 ||
        pos.y < 0 || pos.y >= 3 ||
        pos.z !== 0 || pos.w !== 0
      ) {
        return false;
      }
      const idx = pos.x + pos.y * 5;
      if (this.cells[idx] !== ' ') {
        return false;
      }
      this.cells[idx] = symbol;
      this.occupiedCount++;
      this.undoStack.push({
        movementPlacement: pos,
        movementSymbol: symbol,
      });
      return true;
    }

    if (this.isLimited()) {
      if (
        pos.x < 0 || pos.x >= 3 ||
        pos.y < 0 || pos.y >= 3 ||
        pos.z !== 0 || pos.w !== 0
      ) {
        return false;
      }
      const idx = pos.x + pos.y * 5;
      if (this.cells[idx] !== ' ') {
        return false;
      }
      if (symbol !== 'X' && symbol !== 'O') {
        return false;
      }

      let limitedRemoved: Vector4i | null = null;
      if (this.pieceQueues[symbol].length === 3) {
        limitedRemoved = this.pieceQueues[symbol].shift()!;
        const remIdx = limitedRemoved.x + limitedRemoved.y * 5;
        this.cells[remIdx] = ' ';
        this.occupiedCount--;
      }

      this.cells[idx] = symbol;
      this.occupiedCount++;
      this.pieceQueues[symbol].push(pos);

      this.undoStack.push({
        limitedRemoved,
        limitedSymbol: symbol,
      });

      return true;
    }

    if (this.type === BoardType.Ultimate) {
      if (
        pos.x < 0 || pos.x >= 3 ||
        pos.y < 0 || pos.y >= 3 ||
        pos.z < 0 || pos.z >= 3 ||
        pos.w < 0 || pos.w >= 3
      ) {
        return false;
      }
      const macroIdx = pos.w * 3 + pos.z;
      if (this.activeMacro !== null && this.activeMacro !== macroIdx) {
        return false;
      }
      if (this.macroBoard[macroIdx] !== ' ') {
        return false;
      }
      const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
      if (this.cells[idx] !== ' ') {
        return false;
      }

      this.undoStack.push({
        activeMacro: this.activeMacro,
        prevMacroWinner: this.macroBoard[macroIdx],
        macroIdx,
      });

      this.cells[idx] = symbol;
      this.occupiedCount++;

      const miniWin = this.evaluateMiniBoard(macroIdx);
      if (miniWin !== ' ') {
        this.macroBoard[macroIdx] = miniWin;
      } else if (this.isMiniBoardFull(macroIdx)) {
        this.macroBoard[macroIdx] = 'D';
      }

      const targetMacro = pos.x * 3 + pos.y;
      if (this.macroBoard[targetMacro] !== ' ' || this.isMiniBoardFull(targetMacro)) {
        this.activeMacro = null;
      } else {
        this.activeMacro = targetMacro;
      }

      return true;
    }

    if (pos.x < 0 || pos.x >= this.gridSize || pos.y < 0 || pos.y >= this.gridSize) {
      return false;
    }
    const maxZ =
      this.type === BoardType.TicTacToe4x4_3D ? 4 : this.is3D() || this.is4D() ? 3 : 1;
    const maxW = this.is4D() ? 3 : 1;
    if (pos.z < 0 || pos.z >= maxZ || pos.w < 0 || pos.w >= maxW) {
      return false;
    }

    const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
    if (this.cells[idx] === ' ') {
      this.cells[idx] = symbol;
      this.occupiedCount++;
      return true;
    }
    return false;
  }

  public undoMove(pos: Vector4i): void {
    if (this.isMovement()) {
      const prev = this.undoStack.pop();
      if (prev) {
        if (prev.movementFrom && prev.movementTo && prev.movementSymbol) {
          const fromIdx = prev.movementFrom.x + prev.movementFrom.y * 5;
          const toIdx = prev.movementTo.x + prev.movementTo.y * 5;
          this.cells[toIdx] = ' ';
          this.cells[fromIdx] = prev.movementSymbol;
          return;
        }
        if (prev.movementPlacement) {
          const idx = prev.movementPlacement.x + prev.movementPlacement.y * 5;
          this.cells[idx] = ' ';
          this.occupiedCount--;
          return;
        }
      }
      const idx = pos.x + pos.y * 5;
      if (this.cells[idx] !== ' ') {
        this.cells[idx] = ' ';
        this.occupiedCount--;
      }
      return;
    }

    if (this.isLimited()) {
      const idx = pos.x + pos.y * 5;
      if (this.cells[idx] !== ' ') {
        this.cells[idx] = ' ';
        this.occupiedCount--;
        const prev = this.undoStack.pop();
        if (prev && (prev.limitedSymbol === 'X' || prev.limitedSymbol === 'O')) {
          this.pieceQueues[prev.limitedSymbol].pop();
          if (prev.limitedRemoved) {
            const remIdx = prev.limitedRemoved.x + prev.limitedRemoved.y * 5;
            this.cells[remIdx] = prev.limitedSymbol;
            this.occupiedCount++;
            this.pieceQueues[prev.limitedSymbol].unshift(prev.limitedRemoved);
          }
        }
      }
      return;
    }

    const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
    if (this.cells[idx] !== ' ') {
      this.cells[idx] = ' ';
      this.occupiedCount--;
      if (this.type === BoardType.Ultimate) {
        const prev = this.undoStack.pop();
        if (prev) {
          this.activeMacro = prev.activeMacro !== undefined ? prev.activeMacro : null;
          this.macroBoard[prev.macroIdx!] = prev.prevMacroWinner!;
        }
      }
    }
  }

  public isFull(): boolean {
    if (
      this.type === BoardType.TicTacToe3x3 ||
      this.type === BoardType.ThreePlayers3x3 ||
      this.type === BoardType.Misere3x3 ||
      this.type === BoardType.TimeAttack3x3
    )
      return this.occupiedCount >= 9;
    if (
      this.type === BoardType.Connect4x4 ||
      this.type === BoardType.Gravity4x4 ||
      this.type === BoardType.Obstacles4x4
    )
      return this.occupiedCount >= 16;
    if (
      this.type === BoardType.Connect5x5 ||
      this.type === BoardType.Powers3x3 ||
      this.type === BoardType.ThreePlayers5x5
    ) {
      return this.occupiedCount >= 25;
    }
    if (this.type === BoardType.TicTacToe3D) return this.occupiedCount >= 27;
    if (this.type === BoardType.TicTacToe4x4_3D) return this.occupiedCount >= 64;
    if (this.type === BoardType.TicTacToe4D) return this.occupiedCount >= 81;
    if (this.type === BoardType.Ultimate) {
      return this.occupiedCount >= 81 || this.macroBoard.every((s) => s !== ' ');
    }
    if (this.type === BoardType.Limited3x3) return false;
    if (this.type === BoardType.Movement3x3) return false;
    if (this.type === BoardType.Custom) {
      if (this.isLimited()) return false;
      const total = this.is4D() ? 81 : this.is3D() ? 27 : this.gridSize * this.gridSize;
      return this.occupiedCount >= total;
    }
    return false;
  }

  public getOccupiedCount(): number {
    return this.occupiedCount;
  }

  // --- LÓGICA DE GRAVEDAD (4x4) ---

  public getLowestAvailableRow(col: number): number {
    if (col < 0 || col >= this.gridSize) return -1;
    for (let r = this.gridSize - 1; r >= 0; --r) {
      if (this.isCellEmpty2D(r, col)) {
        return r;
      }
    }
    return -1;
  }

  public isColumnFull(col: number): boolean {
    return this.getLowestAvailableRow(col) === -1;
  }

  // --- DETECCIÓN DE GANADOR (Evaluación directa por índices contiguos) ---

  public checkWinner(): { winner: CellSymbol | 'D'; winningLine?: Vector4i[] } {
    if (this.isMisere()) {
      const lines =
        this.type === BoardType.Custom
          ? getWinningLinesForDimension(this.customRules?.dimension || '3x3')
          : getWinningLines(this.type);
      const lineIndices =
        this.type === BoardType.Custom
          ? getWinningLineIndicesForDimension(this.customRules?.dimension || '3x3')
          : getWinningLineIndices(this.type);

      for (let l = 0; l < lineIndices.length; ++l) {
        const idxs = lineIndices[l];
        const first = this.cells[idxs[0]];
        if (first === ' ') continue;

        let allMatch = true;
        for (let i = 1; i < idxs.length; ++i) {
          if (this.cells[idxs[i]] !== first) {
            allMatch = false;
            break;
          }
        }

        if (allMatch) {
          // REGLA MISÈRE: Quien completa 3 en raya PIERDE. Por tanto, el ganador es el adversario
          const loser = first;
          const winner: CellSymbol = loser === 'X' ? 'O' : 'X';
          return { winner, winningLine: lines[l] };
        }
      }

      if (this.isFull()) {
        return { winner: 'D' };
      }

      return { winner: ' ' };
    }

    if (this.type === BoardType.Ultimate) {
      const macroLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      for (const line of macroLines) {
        const first = this.macroBoard[line[0]];
        if (first === ' ' || first === 'D') continue;
        if (this.macroBoard[line[1]] === first && this.macroBoard[line[2]] === first) {
          const winningLine: Vector4i[] = line.map((m) => ({
            x: 1,
            y: 1,
            z: m % 3,
            w: Math.floor(m / 3),
          }));
          return { winner: first, winningLine };
        }
      }

      if (
        this.isFull() ||
        this.macroBoard.every((s) => s !== ' ') ||
        this.getValidMoves().length === 0
      ) {
        return { winner: 'D' };
      }

      return { winner: ' ' };
    }

    const lines =
      this.type === BoardType.Custom
        ? getWinningLinesForDimension(this.customRules?.dimension || '3x3')
        : getWinningLines(this.type);
    const lineIndices =
      this.type === BoardType.Custom
        ? getWinningLineIndicesForDimension(this.customRules?.dimension || '3x3')
        : getWinningLineIndices(this.type);

    for (let l = 0; l < lineIndices.length; ++l) {
      const idxs = lineIndices[l];
      const first = this.cells[idxs[0]];
      if (first === ' ' || first === '#') continue;

      let allMatch = true;
      for (let i = 1; i < idxs.length; ++i) {
        if (this.cells[idxs[i]] !== first) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return { winner: first, winningLine: lines[l] };
      }
    }

    if (this.isFull()) {
      return { winner: 'D' };
    }

    return { winner: ' ' };
  }

  public clone(): BoardModel {
    const copy = new BoardModel(this.type, this.customRules);
    copy.occupiedCount = this.occupiedCount;
    copy.cells = [...this.cells];
    if (this.type === BoardType.Ultimate) {
      copy.activeMacro = this.activeMacro;
      copy.macroBoard = [...this.macroBoard];
    }
    if (this.type === BoardType.Limited3x3) {
      copy.pieceQueues = {
        X: [...this.pieceQueues.X],
        O: [...this.pieceQueues.O],
      };
    }
    if (this.type === BoardType.Obstacles4x4 && this.obstacles) {
      copy.obstacles = [...this.obstacles];
    }
    if (this.type === BoardType.Movement3x3 || this.type === BoardType.Powers3x3) {
      copy.undoStack = [...this.undoStack];
    }
    return copy;
  }
}
