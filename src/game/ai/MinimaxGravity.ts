import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { evaluateBoard4x4 } from './Minimax4x4';

export function findWinningOrBlockingMoveGravity(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  for (let c = 0; c < 4; ++c) {
    const r = board.getLowestAvailableRow(c);
    if (r !== -1) {
      const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
      board.makeMove(pos, symbol);
      const { winner } = board.checkWinner();
      board.undoMove(pos);

      if (winner === symbol) {
        return pos;
      }
    }
  }
  return null;
}

export function getRandomMoveGravity(board: BoardModel): Vector4i | null {
  const validCols: number[] = [];
  for (let c = 0; c < 4; ++c) {
    if (!board.isColumnFull(c)) {
      validCols.push(c);
    }
  }
  if (validCols.length === 0) return null;
  const chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
  return { x: board.getLowestAvailableRow(chosenCol), y: chosenCol, z: 0, w: 0 };
}

function evaluateBoardGravity4x4(board: BoardModel, aiSymbol: CellSymbol, humanSymbol: CellSymbol): number {
  let score = evaluateBoard4x4(board, aiSymbol, humanSymbol);

  // Bonificación posicional por control de columnas centrales (columnas 1 y 2)
  for (let r = 0; r < 4; ++r) {
    const c1 = board.getCell2D(r, 1);
    const c2 = board.getCell2D(r, 2);

    if (c1 === aiSymbol) score += 6;
    else if (c1 === humanSymbol) score -= 6;

    if (c2 === aiSymbol) score += 6;
    else if (c2 === humanSymbol) score -= 6;
  }

  return score;
}

function minimaxGravity4x4(
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

  if (depth >= 6) {
    return evaluateBoardGravity4x4(board, aiSymbol, humanSymbol);
  }

  const colOrder = [1, 2, 0, 3];

  if (isMaximizing) {
    let maxEval = -50000;
    let hasMoves = false;

    for (const c of colOrder) {
      const r = board.getLowestAvailableRow(c);
      if (r !== -1) {
        hasMoves = true;
        const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
        board.makeMove(pos, aiSymbol);
        const evalScore = minimaxGravity4x4(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
        board.undoMove(pos);

        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
    }
    return hasMoves ? maxEval : 0;
  } else {
    let minEval = 50000;
    let hasMoves = false;

    for (const c of colOrder) {
      const r = board.getLowestAvailableRow(c);
      if (r !== -1) {
        hasMoves = true;
        const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
        board.makeMove(pos, humanSymbol);
        const evalScore = minimaxGravity4x4(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
        board.undoMove(pos);

        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
    }
    return hasMoves ? minEval : 0;
  }
}

export function getBestMoveGravity4x4(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 75% columna legal aleatoria
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 75) {
      const rand = getRandomMoveGravity(board);
      if (rand) return rand;
    }
    const winMove = findWinningOrBlockingMoveGravity(board, aiSymbol);
    if (winMove) return winMove;
    return getRandomMoveGravity(board) || { x: 3, y: 1, z: 0, w: 0 };
  } else if (difficulty === Difficulty.Medium) {
    // 1. Ganar si existe jugada directa (85%)
    if (Math.random() * 100 <= 85) {
      const winMove = findWinningOrBlockingMoveGravity(board, aiSymbol);
      if (winMove) return winMove;
    }

    // 2. Bloquear victoria del rival (75%)
    if (Math.random() * 100 <= 75) {
      const blockMove = findWinningOrBlockingMoveGravity(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // 3. Detectar columnas suicidas (no regalar victoria arriba)
    const safeCols: number[] = [];
    for (let c = 0; c < 4; ++c) {
      const r = board.getLowestAvailableRow(c);
      if (r !== -1) {
        let suicidal = false;
        if (r - 1 >= 0) {
          const moveAI: Vector4i = { x: r, y: c, z: 0, w: 0 };
          const moveHumanAbove: Vector4i = { x: r - 1, y: c, z: 0, w: 0 };

          board.makeMove(moveAI, aiSymbol);
          board.makeMove(moveHumanAbove, humanSymbol);
          const { winner } = board.checkWinner();
          if (winner === humanSymbol) suicidal = true;
          board.undoMove(moveHumanAbove);
          board.undoMove(moveAI);
        }

        if (!suicidal || Math.random() * 100 > 60) {
          safeCols.push(c);
        }
      }
    }

    // 4. 30% elige una columna segura al azar
    if (Math.random() * 100 <= 30 && safeCols.length > 0) {
      const c = safeCols[Math.floor(Math.random() * safeCols.length)];
      return { x: board.getLowestAvailableRow(c), y: c, z: 0, w: 0 };
    }

    // 5. Minimax a profundidad 3
    let bestVal = -50000;
    const bestMoves: Vector4i[] = [];
    const colsToEvaluate = safeCols.length === 0 ? [1, 2, 0, 3] : safeCols;

    for (const c of colsToEvaluate) {
      const r = board.getLowestAvailableRow(c);
      if (r !== -1) {
        const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
        board.makeMove(pos, aiSymbol);
        const moveVal = minimaxGravity4x4(board, 3, false, aiSymbol, humanSymbol, -50000, 50000);
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

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    return getRandomMoveGravity(board) || { x: 3, y: 1, z: 0, w: 0 };
  }

  // Modo Difícil (Hard): Minimax depth 6 completo con ordenación óptima
  const winMove = findWinningOrBlockingMoveGravity(board, aiSymbol);
  if (winMove) return winMove;

  const blockMove = findWinningOrBlockingMoveGravity(board, humanSymbol);
  if (blockMove) return blockMove;

  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];
  const colOrder = [1, 2, 0, 3];

  for (const c of colOrder) {
    const r = board.getLowestAvailableRow(c);
    if (r !== -1) {
      const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
      board.makeMove(pos, aiSymbol);
      const moveVal = minimaxGravity4x4(board, 0, false, aiSymbol, humanSymbol, -50000, 50000);
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

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return getRandomMoveGravity(board) || { x: 3, y: 1, z: 0, w: 0 };
}
