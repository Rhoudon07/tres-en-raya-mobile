import { BoardType, CellSymbol, Vector4i, areVectorsEqual } from '../../types/board';
import { getWinningLines } from './WinningLines';

/**
 * Modelo de datos puro del tablero.
 * Replica fielmente toda la lógica de Board.h y Board.cpp de C++.
 */
export class BoardModel {
  public readonly type: BoardType;
  public readonly gridSize: number;
  public readonly winCondition: number;

  // Representación interna en array lineal o 4D
  // x: row (0..gridSize-1), y: col (0..gridSize-1), z: layer (0..2), w: universe (0..2)
  private grid: Map<string, CellSymbol>;
  private occupiedCount: number;

  constructor(type: BoardType = BoardType.TicTacToe3x3) {
    this.type = type;
    this.grid = new Map<string, CellSymbol>();
    this.occupiedCount = 0;

    if (type === BoardType.Connect5x5) {
      this.gridSize = 5;
      this.winCondition = 5;
    } else if (
      type === BoardType.Connect4x4 ||
      type === BoardType.Gravity4x4 ||
      type === BoardType.TicTacToe4x4_3D
    ) {
      this.gridSize = 4;
      this.winCondition = 4;
    } else {
      this.gridSize = 3;
      this.winCondition = 3;
    }
  }

  public hasGravity(): boolean {
    return this.type === BoardType.Gravity4x4;
  }

  public is3D(): boolean {
    return this.type === BoardType.TicTacToe3D || this.type === BoardType.TicTacToe4x4_3D;
  }

  public is4D(): boolean {
    return this.type === BoardType.TicTacToe4D;
  }

  private keyOf(pos: Vector4i): string {
    return `${pos.x},${pos.y},${pos.z},${pos.w}`;
  }

  public reset(): void {
    this.grid.clear();
    this.occupiedCount = 0;
  }

  public getCell(pos: Vector4i): CellSymbol {
    return this.grid.get(this.keyOf(pos)) || ' ';
  }

  public getCell2D(r: number, c: number): CellSymbol {
    return this.getCell({ x: r, y: c, z: 0, w: 0 });
  }

  public getCell3D(r: number, c: number, z: number): CellSymbol {
    return this.getCell({ x: r, y: c, z, w: 0 });
  }

  public getCell4D(x: number, y: number, z: number, w: number): CellSymbol {
    return this.getCell({ x, y, z, w });
  }

  public isCellEmpty(pos: Vector4i): boolean {
    return this.getCell(pos) === ' ';
  }

  public isCellEmpty2D(r: number, c: number): boolean {
    return this.isCellEmpty({ x: r, y: c, z: 0, w: 0 });
  }

  public isCellEmpty3D(r: number, c: number, z: number): boolean {
    return this.isCellEmpty({ x: r, y: c, z, w: 0 });
  }

  public isCellEmpty4D(x: number, y: number, z: number, w: number): boolean {
    return this.isCellEmpty({ x, y, z, w });
  }

  public makeMove(pos: Vector4i, symbol: CellSymbol): boolean {
    if (pos.x < 0 || pos.x >= this.gridSize || pos.y < 0 || pos.y >= this.gridSize) {
      return false;
    }
    const maxZ =
      this.type === BoardType.TicTacToe4x4_3D ? 4 : this.is3D() || this.is4D() ? 3 : 1;
    const maxW = this.is4D() ? 3 : 1;
    if (pos.z < 0 || pos.z >= maxZ || pos.w < 0 || pos.w >= maxW) {
      return false;
    }

    if (this.isCellEmpty(pos)) {
      this.grid.set(this.keyOf(pos), symbol);
      this.occupiedCount++;
      return true;
    }
    return false;
  }

  public undoMove(pos: Vector4i): void {
    const k = this.keyOf(pos);
    if (this.grid.has(k) && this.grid.get(k) !== ' ') {
      this.grid.delete(k);
      this.occupiedCount--;
    }
  }

  public isFull(): boolean {
    if (this.type === BoardType.TicTacToe3x3) return this.occupiedCount >= 9;
    if (this.type === BoardType.Connect4x4 || this.type === BoardType.Gravity4x4) return this.occupiedCount >= 16;
    if (this.type === BoardType.Connect5x5) return this.occupiedCount >= 25;
    if (this.type === BoardType.TicTacToe3D) return this.occupiedCount >= 27;
    if (this.type === BoardType.TicTacToe4x4_3D) return this.occupiedCount >= 64;
    if (this.type === BoardType.TicTacToe4D) return this.occupiedCount >= 81;
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

  // --- DETECCIÓN DE GANADOR ---

  public checkWinner(): { winner: CellSymbol | 'D'; winningLine?: Vector4i[] } {
    const lines = getWinningLines(this.type);

    for (const line of lines) {
      const first = this.getCell(line[0]);
      if (first === ' ') continue;

      let allMatch = true;
      for (let i = 1; i < line.length; ++i) {
        if (this.getCell(line[i]) !== first) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return { winner: first, winningLine: line };
      }
    }

    if (this.isFull()) {
      return { winner: 'D' };
    }

    return { winner: ' ' };
  }

  public clone(): BoardModel {
    const copy = new BoardModel(this.type);
    copy.occupiedCount = this.occupiedCount;
    this.grid.forEach((v, k) => copy.grid.set(k, v));
    return copy;
  }
}
