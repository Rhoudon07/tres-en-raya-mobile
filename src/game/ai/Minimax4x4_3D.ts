import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i, BoardType } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getWinningLines } from '../board/WinningLines';

/**
 * Motor Minimax e IA optimizada para 4x4x4 3D (Qubic 4x4, 64 celdas, 76 líneas).
 */

export function findWinningOrBlockingMove4x4_3D(
  board: BoardModel,
  symbol: CellSymbol
): Vector4i | null {
  for (let z = 0; z < 4; ++z) {
    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        if (board.isCellEmpty3D(r, c, z)) {
          const pos: Vector4i = { x: r, y: c, z, w: 0 };
          board.makeMove(pos, symbol);
          const { winner } = board.checkWinner();
          board.undoMove(pos);

          if (winner === symbol) {
            return pos;
          }
        }
      }
    }
  }
  return null;
}

export function getRandomMove4x4_3D(board: BoardModel): Vector4i | null {
  const emptyCells: Vector4i[] = [];
  for (let z = 0; z < 4; ++z) {
    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        if (board.isCellEmpty3D(r, c, z)) {
          emptyCells.push({ x: r, y: c, z, w: 0 });
        }
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function evaluateLine4x4_3D(
  line: Vector4i[],
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  let aiCount = 0;
  let humanCount = 0;

  for (let i = 0; i < 4; ++i) {
    const c = board.getCell(line[i]);
    if (c === aiSymbol) aiCount++;
    else if (c === humanSymbol) humanCount++;
  }

  // Línea bloqueada por ambos jugadores
  if (aiCount > 0 && humanCount > 0) return 0;

  if (humanCount === 0) {
    if (aiCount === 4) return 10000;
    if (aiCount === 3) return 160;
    if (aiCount === 2) return 16;
    if (aiCount === 1) return 2;
  } else if (aiCount === 0) {
    if (humanCount === 4) return -10000;
    if (humanCount === 3) return -200;
    if (humanCount === 2) return -18;
    if (humanCount === 1) return -2;
  }

  return 0;
}

// 8 Celdas centrales del cubo 4x4x4 (x in 1..2, y in 1..2, z in 1..2)
const CENTERS_4x4_3D: Vector4i[] = [
  { x: 1, y: 1, z: 1, w: 0 },
  { x: 1, y: 2, z: 1, w: 0 },
  { x: 2, y: 1, z: 1, w: 0 },
  { x: 2, y: 2, z: 1, w: 0 },
  { x: 1, y: 1, z: 2, w: 0 },
  { x: 1, y: 2, z: 2, w: 0 },
  { x: 2, y: 1, z: 2, w: 0 },
  { x: 2, y: 2, z: 2, w: 0 },
];

// 8 Esquinas exteriores del cubo 4x4x4
const CORNERS_4x4_3D: Vector4i[] = [
  { x: 0, y: 0, z: 0, w: 0 },
  { x: 0, y: 3, z: 0, w: 0 },
  { x: 3, y: 0, z: 0, w: 0 },
  { x: 3, y: 3, z: 0, w: 0 },
  { x: 0, y: 0, z: 3, w: 0 },
  { x: 0, y: 3, z: 3, w: 0 },
  { x: 3, y: 0, z: 3, w: 0 },
  { x: 3, y: 3, z: 3, w: 0 },
];

export function evaluateBoard4x4_3D(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  let score = 0;
  const lines = getWinningLines(BoardType.TicTacToe4x4_3D);

  for (let i = 0; i < lines.length; ++i) {
    score += evaluateLine4x4_3D(lines[i], board, aiSymbol, humanSymbol);
  }

  // Bonificación por control de los 8 centros interiores
  for (let i = 0; i < CENTERS_4x4_3D.length; ++i) {
    const cell = board.getCell(CENTERS_4x4_3D[i]);
    if (cell === aiSymbol) score += 6;
    else if (cell === humanSymbol) score -= 6;
  }

  // Bonificación por control de las 8 esquinas exteriores
  for (let i = 0; i < CORNERS_4x4_3D.length; ++i) {
    const cell = board.getCell(CORNERS_4x4_3D[i]);
    if (cell === aiSymbol) score += 4;
    else if (cell === humanSymbol) score -= 4;
  }

  return score;
}

function getCandidateMoves(board: BoardModel): Vector4i[] {
  const moves: Vector4i[] = [];
  for (let z = 0; z < 4; ++z) {
    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        if (board.isCellEmpty3D(r, c, z)) {
          moves.push({ x: r, y: c, z, w: 0 });
        }
      }
    }
  }
  return moves;
}

function minimax4x4_3D(
  board: BoardModel,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  alpha: number,
  beta: number
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 10000 - depth;
  if (winner === humanSymbol) return depth - 10000;
  if (winner === 'D') return 0;

  if (depth >= 2) {
    return evaluateBoard4x4_3D(board, aiSymbol, humanSymbol);
  }

  const candidates = getCandidateMoves(board);

  if (isMaximizing) {
    let maxEval = -50000;
    for (let i = 0; i < candidates.length; ++i) {
      const pos = candidates[i];
      board.makeMove(pos, aiSymbol);
      const evalScore = minimax4x4_3D(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
      board.undoMove(pos);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = 50000;
    for (let i = 0; i < candidates.length; ++i) {
      const pos = candidates[i];
      board.makeMove(pos, humanSymbol);
      const evalScore = minimax4x4_3D(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
      board.undoMove(pos);

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove4x4_3D(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 75% casilla 3D aleatoria
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 75) {
      const rand = getRandomMove4x4_3D(board);
      if (rand) return rand;
    }
    const winMove = findWinningOrBlockingMove4x4_3D(board, aiSymbol);
    if (winMove) return winMove;
    return getRandomMove4x4_3D(board) || { x: 1, y: 1, z: 1, w: 0 };
  }

  if (difficulty === Difficulty.Medium) {
    // 1. Ganar si existe jugada directa (85%)
    if (Math.random() * 100 <= 85) {
      const winMove = findWinningOrBlockingMove4x4_3D(board, aiSymbol);
      if (winMove) return winMove;
    }

    // 2. Bloquear victoria rival (75%)
    if (Math.random() * 100 <= 75) {
      const blockMove = findWinningOrBlockingMove4x4_3D(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // 3. 30% movimiento aleatorio
    if (Math.random() * 100 <= 30) {
      const rand = getRandomMove4x4_3D(board);
      if (rand) return rand;
    }
  }

  // Apertura en tablero vacío: tomar uno de los 8 centros tridimensionales
  const occupied = board.getOccupiedCount();
  if (occupied === 0) {
    return CENTERS_4x4_3D[Math.floor(Math.random() * CENTERS_4x4_3D.length)];
  }

  // 1. Detección inmediata de victoria (100% en Hard o fallback de Medium)
  const winMove = findWinningOrBlockingMove4x4_3D(board, aiSymbol);
  if (winMove) return winMove;

  // 2. Detección inmediata de bloqueo (100% en Hard o fallback de Medium)
  const blockMove = findWinningOrBlockingMove4x4_3D(board, humanSymbol);
  if (blockMove) return blockMove;

  // 3. Minimax depth 2 con poda alfa-beta
  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];
  const candidates = getCandidateMoves(board);

  for (let i = 0; i < candidates.length; ++i) {
    const pos = candidates[i];
    board.makeMove(pos, aiSymbol);
    const moveVal = minimax4x4_3D(board, 1, false, aiSymbol, humanSymbol, -50000, 50000);
    board.undoMove(pos);

    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMoves.length = 0;
      bestMoves.push(pos);
    } else if (moveVal === bestVal) {
      bestMoves.push(pos);
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return getRandomMove4x4_3D(board) || { x: 1, y: 1, z: 1, w: 0 };
}
