import { BoardType, CellSymbol, Vector4i } from '../../types/board';
import { getWinningLines, getWinningLineIndices, coordToIndex } from './WinningLines';

/**
 * Modelo de datos puro del tablero con alta optimización de rendimiento.
 * Utiliza un array lineal contiguo en memoria con indexación aritmética O(1)
 * libre de asignaciones de strings en cada ciclo de Minimax.
 */
export class BoardModel {
  public readonly type: BoardType;
  public readonly gridSize: number;
  public readonly winCondition: number;

  // Representación interna en array lineal plano de 300 elementos:
  // idx = x + y*5 + z*25 + w*100
  private cells: CellSymbol[];
  private occupiedCount: number;

  constructor(type: BoardType = BoardType.TicTacToe3x3) {
    this.type = type;
    this.cells = new Array(300).fill(' ');
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

  public reset(): void {
    this.cells.fill(' ');
    this.occupiedCount = 0;
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

    const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
    if (this.cells[idx] === ' ') {
      this.cells[idx] = symbol;
      this.occupiedCount++;
      return true;
    }
    return false;
  }

  public undoMove(pos: Vector4i): void {
    const idx = pos.x + pos.y * 5 + pos.z * 25 + pos.w * 100;
    if (this.cells[idx] !== ' ') {
      this.cells[idx] = ' ';
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

  // --- DETECCIÓN DE GANADOR (Evaluación directa por índices contiguos) ---

  public checkWinner(): { winner: CellSymbol | 'D'; winningLine?: Vector4i[] } {
    const lines = getWinningLines(this.type);
    const lineIndices = getWinningLineIndices(this.type);

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
        return { winner: first, winningLine: lines[l] };
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
    copy.cells = [...this.cells];
    return copy;
  }
}
