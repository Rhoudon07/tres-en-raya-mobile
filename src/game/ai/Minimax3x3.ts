import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

export function findWinningOrBlockingMove3x3(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      if (board.isCellEmpty2D(r, c)) {
        const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
        board.makeMove(pos, symbol);
        const { winner } = board.checkWinner();
        board.undoMove(pos);

        if (winner === symbol) {
          return pos;
        }
      }
    }
  }
  return null;
}

export function getRandomMove3x3(board: BoardModel): Vector4i | null {
  const emptyCells: Vector4i[] = [];
  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      if (board.isCellEmpty2D(r, c)) {
        emptyCells.push({ x: r, y: c, z: 0, w: 0 });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  const idx = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[idx];
}

function minimax(
  board: BoardModel,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  alpha: number,
  beta: number
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 10 - depth;
  if (winner === humanSymbol) return depth - 10;
  if (winner === 'D') return 0;

  if (isMaximizing) {
    let maxEval = -10000;
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (board.isCellEmpty2D(r, c)) {
          const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
          board.makeMove(pos, aiSymbol);
          const evalScore = minimax(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
          board.undoMove(pos);

          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = 10000;
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (board.isCellEmpty2D(r, c)) {
          const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
          board.makeMove(pos, humanSymbol);
          const evalScore = minimax(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
          board.undoMove(pos);

          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
      }
    }
    return minEval;
  }
}

export function getBestMove3x3(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 70% movimiento aleatorio
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 70) {
      const rand = getRandomMove3x3(board);
      if (rand) return rand;
    }
  } else if (difficulty === Difficulty.Medium) {
    // 1. Ganar de inmediato
    const winMove = findWinningOrBlockingMove3x3(board, aiSymbol);
    if (winMove) return winMove;

    // 2. Bloquear al rival
    const blockMove = findWinningOrBlockingMove3x3(board, humanSymbol);
    if (blockMove) return blockMove;

    // 3. Probabilidad de jugada aleatoria (40%)
    if (Math.random() * 100 <= 40) {
      const rand = getRandomMove3x3(board);
      if (rand) return rand;
    }
  }

  // Nivel Difícil (Hard): Minimax Óptimo Puro
  const occupied = board.getOccupiedCount();

  // Apertura óptima: centro y esquinas
  if (occupied === 0) {
    const openings: Vector4i[] = [
      { x: 1, y: 1, z: 0, w: 0 },
      { x: 0, y: 0, z: 0, w: 0 },
      { x: 0, y: 2, z: 0, w: 0 },
      { x: 2, y: 0, z: 0, w: 0 },
      { x: 2, y: 2, z: 0, w: 0 },
    ];
    return openings[Math.floor(Math.random() * openings.length)];
  }

  // Respuesta al primer movimiento: si centro está libre, ocuparlo
  if (occupied === 1 && board.isCellEmpty2D(1, 1)) {
    return { x: 1, y: 1, z: 0, w: 0 };
  }

  let bestVal = -10000;
  const bestMoves: Vector4i[] = [];

  for (let r = 0; r < 3; ++r) {
    for (let c = 0; c < 3; ++c) {
      if (board.isCellEmpty2D(r, c)) {
        const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
        board.makeMove(pos, aiSymbol);
        const moveVal = minimax(board, 0, false, aiSymbol, humanSymbol, -10000, 10000);
        board.undoMove(pos);

        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMoves.length = 0;
          bestMoves.push(pos);
        } else if (moveVal === bestVal) {
          bestMoves.push(pos);
        }
      }
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return getRandomMove3x3(board) || { x: 1, y: 1, z: 0, w: 0 };
}
