import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

/**
 * Motor Minimax especializado para Misère Tic-Tac-Toe (Inverso).
 * REGLA: QUIEN FORMA 3 EN RAYA PIERDE (gana el rival).
 */
function minimaxMisere(
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

  // En Misère, board.checkWinner() ya asigna como 'winner' al adversario del que completó la línea
  if (winner === aiSymbol) return 10000 + depth;
  if (winner === humanSymbol) return -10000 - depth;
  if (winner === 'D') return 0;
  if (depth >= maxDepth) return 0;

  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return 0;

  const curSymbol = isMaximizing ? aiSymbol : humanSymbol;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      board.makeMove(move, curSymbol);
      const evalScore = minimaxMisere(
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
      const evalScore = minimaxMisere(
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

export function getBestMoveMisere(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty = Difficulty.Hard
): Vector4i {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return { x: 0, y: 0, z: 0, w: 0 };
  if (validMoves.length === 1) return validMoves[0];

  // 1. REGLA FUNDAMENTAL DE SUPERVIVENCIA EN MISÈRE:
  // NUNCA jugar una casilla que complete 3 en raya propio si hay alternativas
  const safeMoves: Vector4i[] = [];
  for (const move of validMoves) {
    board.makeMove(move, aiSymbol);
    const { winner } = board.checkWinner();
    board.undoMove(move);
    // Si winner === humanSymbol, significa que la IA completó 3 en raya y perdió
    if (winner !== humanSymbol) {
      safeMoves.push(move);
    }
  }

  // Si todas las jugadas conducen a la derrota forzada, jugar cualquiera
  const candidateMoves = safeMoves.length > 0 ? safeMoves : validMoves;

  // En nivel Easy: selección aleatoria
  if (difficulty === Difficulty.Easy) {
    return candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
  }

  // En nivel Medium y Hard: Minimax con poda Alfa-Beta
  const maxDepth = difficulty === Difficulty.Hard ? 9 : 3;

  let bestMove = candidateMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of candidateMoves) {
    board.makeMove(move, aiSymbol);
    const score = minimaxMisere(
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
