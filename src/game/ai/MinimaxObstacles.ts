import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

export function findWinningOrBlockingMoveObstacles(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  const validMoves = board.getValidMoves();
  for (const pos of validMoves) {
    board.makeMove(pos, symbol);
    const { winner } = board.checkWinner();
    board.undoMove(pos);

    if (winner === symbol) {
      return pos;
    }
  }
  return null;
}

function evaluateLineObstacles(
  c1: CellSymbol,
  c2: CellSymbol,
  c3: CellSymbol,
  c4: CellSymbol,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  // Si la línea contiene un obstáculo, queda permanentemente bloqueada para ambos
  if (c1 === '#' || c2 === '#' || c3 === '#' || c4 === '#') return 0;

  let aiCount = 0;
  let humanCount = 0;

  const cells = [c1, c2, c3, c4];
  for (const c of cells) {
    if (c === aiSymbol) aiCount++;
    else if (c === humanSymbol) humanCount++;
  }

  if (aiCount > 0 && humanCount > 0) return 0;

  if (humanCount === 0) {
    if (aiCount === 4) return 10000;
    if (aiCount === 3) return 120;
    if (aiCount === 2) return 15;
    if (aiCount === 1) return 2;
  } else if (aiCount === 0) {
    if (humanCount === 4) return -10000;
    if (humanCount === 3) return -150;
    if (humanCount === 2) return -18;
    if (humanCount === 1) return -2;
  }

  return 0;
}

export function evaluateBoardObstacles(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  let score = 0;

  // 4 Filas
  for (let r = 0; r < 4; ++r) {
    score += evaluateLineObstacles(
      board.getCell2D(r, 0),
      board.getCell2D(r, 1),
      board.getCell2D(r, 2),
      board.getCell2D(r, 3),
      aiSymbol,
      humanSymbol
    );
  }

  // 4 Columnas
  for (let c = 0; c < 4; ++c) {
    score += evaluateLineObstacles(
      board.getCell2D(0, c),
      board.getCell2D(1, c),
      board.getCell2D(2, c),
      board.getCell2D(3, c),
      aiSymbol,
      humanSymbol
    );
  }

  // 2 Diagonales
  score += evaluateLineObstacles(
    board.getCell2D(0, 0),
    board.getCell2D(1, 1),
    board.getCell2D(2, 2),
    board.getCell2D(3, 3),
    aiSymbol,
    humanSymbol
  );

  score += evaluateLineObstacles(
    board.getCell2D(0, 3),
    board.getCell2D(1, 2),
    board.getCell2D(2, 1),
    board.getCell2D(3, 0),
    aiSymbol,
    humanSymbol
  );

  // Bonus territorial por casillas centrales (1,1), (1,2), (2,1), (2,2)
  const centerCoords = [
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
  ];
  for (const { r, c } of centerCoords) {
    const sym = board.getCell2D(r, c);
    if (sym === aiSymbol) score += 6;
    else if (sym === humanSymbol) score -= 6;
  }

  return score;
}

function minimaxObstacles(
  board: BoardModel,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 10000 + depth;
  if (winner === humanSymbol) return -10000 - depth;
  if (board.isFull() || depth === 0) {
    return evaluateBoardObstacles(board, aiSymbol, humanSymbol);
  }

  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      board.makeMove(move, aiSymbol);
      const evalScore = minimaxObstacles(board, depth - 1, alpha, beta, false, aiSymbol, humanSymbol);
      board.undoMove(move);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      board.makeMove(move, humanSymbol);
      const evalScore = minimaxObstacles(board, depth - 1, alpha, beta, true, aiSymbol, humanSymbol);
      board.undoMove(move);

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMoveObstacles(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty = Difficulty.Hard
): Vector4i {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return { x: 0, y: 0, z: 0, w: 0 };

  if (difficulty === Difficulty.Easy) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 1. Ganar de inmediato si existe victoria en 1 jugada
  const winningMove = findWinningOrBlockingMoveObstacles(board, aiSymbol);
  if (winningMove) return winningMove;

  // 2. Bloquear victoria inminente del oponente
  const blockingMove = findWinningOrBlockingMoveObstacles(board, humanSymbol);
  if (blockingMove) return blockingMove;

  if (difficulty === Difficulty.Medium) {
    // Profundidad 2
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const move of validMoves) {
      board.makeMove(move, aiSymbol);
      const score = minimaxObstacles(board, 1, -Infinity, Infinity, false, aiSymbol, humanSymbol);
      board.undoMove(move);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // 3. Dificultad Hard: Profundidad 3 con Alpha-Beta
  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const move of validMoves) {
    board.makeMove(move, aiSymbol);
    const score = minimaxObstacles(board, 3, -Infinity, Infinity, false, aiSymbol, humanSymbol);
    board.undoMove(move);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
