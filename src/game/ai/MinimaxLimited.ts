import { BoardModel } from '../board/BoardModel';
import { BoardType, CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getWinningLines } from '../board/WinningLines';

const LINES_3X3 = getWinningLines(BoardType.TicTacToe3x3);

/**
 * Evaluación estática de posición para Fichas Limitadas.
 */
function evaluateLimitedPosition(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 10000;
  if (winner === humanSymbol) return -10000;

  let score = 0;

  for (const line of LINES_3X3) {
    let aiCount = 0;
    let humanCount = 0;
    let emptyCount = 0;

    for (const pos of line) {
      const s = board.getCell(pos);
      if (s === aiSymbol) aiCount++;
      else if (s === humanSymbol) humanCount++;
      else emptyCount++;
    }

    if (aiCount === 2 && emptyCount === 1) score += 150;
    else if (humanCount === 2 && emptyCount === 1) score -= 180;
    else if (aiCount === 1 && emptyCount === 2) score += 15;
    else if (humanCount === 1 && emptyCount === 2) score -= 15;
  }

  // Control del centro (1,1)
  if (board.getCell2D(1, 1) === aiSymbol) score += 40;
  else if (board.getCell2D(1, 1) === humanSymbol) score -= 40;

  return score;
}

/**
 * Búsqueda Minimax con límite de profundidad y poda Alfa-Beta para Fichas Limitadas.
 */
function alphaBetaLimited(
  board: BoardModel,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  maxDepth: number
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 10000 + depth;
  if (winner === humanSymbol) return -10000 - depth;
  if (depth >= maxDepth) {
    return evaluateLimitedPosition(board, aiSymbol, humanSymbol);
  }

  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return 0;

  const curSymbol = isMaximizing ? aiSymbol : humanSymbol;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      board.makeMove(move, curSymbol);
      const evalScore = alphaBetaLimited(
        board,
        depth + 1,
        alpha,
        beta,
        false,
        aiSymbol,
        humanSymbol,
        maxDepth
      );
      board.undoMove(move);

      if (evalScore > maxEval) maxEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      board.makeMove(move, curSymbol);
      const evalScore = alphaBetaLimited(
        board,
        depth + 1,
        alpha,
        beta,
        true,
        aiSymbol,
        humanSymbol,
        maxDepth
      );
      board.undoMove(move);

      if (evalScore < minEval) minEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMoveLimited(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty = Difficulty.Hard
): Vector4i {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return { x: 0, y: 0, z: 0, w: 0 };
  if (validMoves.length === 1) return validMoves[0];

  // 1. Detección inmediata de victoria en 1 movimiento
  for (const move of validMoves) {
    board.makeMove(move, aiSymbol);
    const { winner } = board.checkWinner();
    board.undoMove(move);
    if (winner === aiSymbol) {
      return move;
    }
  }

  // 2. Detección inmediata de bloqueo de victoria inminente del adversario
  for (const move of validMoves) {
    board.makeMove(move, humanSymbol);
    const { winner } = board.checkWinner();
    board.undoMove(move);
    if (winner === humanSymbol) {
      return move;
    }
  }

  // 3. En dificultad Easy: 40% aleatorio
  if (difficulty === Difficulty.Easy) {
    if (Math.random() < 0.4) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  // 4. Búsqueda Alpha-Beta (Hard: profundidad 5; Medium: profundidad 2)
  const maxDepth = difficulty === Difficulty.Hard ? 5 : 2;

  let bestMove = validMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // Ordenar movimientos prefiriendo el centro (1,1)
  const sortedMoves = validMoves.slice().sort((a, b) => {
    let sA = 0;
    let sB = 0;
    if (a.x === 1 && a.y === 1) sA += 30;
    if (b.x === 1 && b.y === 1) sB += 30;
    return sB - sA;
  });

  for (const move of sortedMoves) {
    board.makeMove(move, aiSymbol);
    const score = alphaBetaLimited(
      board,
      0,
      alpha,
      beta,
      false,
      aiSymbol,
      humanSymbol,
      maxDepth
    );
    board.undoMove(move);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return bestMove;
}
