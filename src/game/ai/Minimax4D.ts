import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i, BoardType } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getWinningLines } from '../board/WinningLines';

export function findWinningOrBlockingMove4D(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  for (let x = 0; x < 3; ++x) {
    for (let y = 0; y < 3; ++y) {
      for (let z = 0; z < 3; ++z) {
        for (let w = 0; w < 3; ++w) {
          if (board.isCellEmpty4D(x, y, z, w)) {
            const pos: Vector4i = { x, y, z, w };
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
  }
  return null;
}

export function getRandomMove4D(board: BoardModel): Vector4i | null {
  const emptyCells: Vector4i[] = [];
  for (let x = 0; x < 3; ++x) {
    for (let y = 0; y < 3; ++y) {
      for (let z = 0; z < 3; ++z) {
        for (let w = 0; w < 3; ++w) {
          if (board.isCellEmpty4D(x, y, z, w)) {
            emptyCells.push({ x, y, z, w });
          }
        }
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function evaluateLine4D(
  c1: CellSymbol,
  c2: CellSymbol,
  c3: CellSymbol,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  let aiCount = 0;
  let humanCount = 0;

  if (c1 === aiSymbol) aiCount++;
  else if (c1 === humanSymbol) humanCount++;

  if (c2 === aiSymbol) aiCount++;
  else if (c2 === humanSymbol) humanCount++;

  if (c3 === aiSymbol) aiCount++;
  else if (c3 === humanSymbol) humanCount++;

  if (aiCount > 0 && humanCount > 0) return 0;

  if (aiCount === 3) return 10000;
  if (aiCount === 2) return 100;
  if (aiCount === 1) return 10;

  if (humanCount === 3) return -10000;
  if (humanCount === 2) return -130;
  if (humanCount === 1) return -10;

  return 0;
}

export function evaluateBoard4D(board: BoardModel, aiSymbol: CellSymbol, humanSymbol: CellSymbol): number {
  let score = 0;
  const lines = getWinningLines(BoardType.TicTacToe4D);

  for (const line of lines) {
    const c1 = board.getCell(line[0]);
    const c2 = board.getCell(line[1]);
    const c3 = board.getCell(line[2]);
    score += evaluateLine4D(c1, c2, c3, aiSymbol, humanSymbol);
  }

  const centerVal = board.getCell4D(1, 1, 1, 1);
  if (centerVal === aiSymbol) score += 40;
  else if (centerVal === humanSymbol) score -= 40;

  return score;
}

function minimax4D(
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

  if (depth >= 1) {
    return evaluateBoard4D(board, aiSymbol, humanSymbol);
  }

  if (isMaximizing) {
    let maxEval = -50000;
    for (let x = 0; x < 3; ++x) {
      for (let y = 0; y < 3; ++y) {
        for (let z = 0; z < 3; ++z) {
          for (let w = 0; w < 3; ++w) {
            if (board.isCellEmpty4D(x, y, z, w)) {
              const pos: Vector4i = { x, y, z, w };
              board.makeMove(pos, aiSymbol);
              const evalScore = minimax4D(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
              board.undoMove(pos);

              maxEval = Math.max(maxEval, evalScore);
              alpha = Math.max(alpha, evalScore);
              if (beta <= alpha) return maxEval;
            }
          }
        }
      }
    }
    return maxEval;
  } else {
    let minEval = 50000;
    for (let x = 0; x < 3; ++x) {
      for (let y = 0; y < 3; ++y) {
        for (let z = 0; z < 3; ++z) {
          for (let w = 0; w < 3; ++w) {
            if (board.isCellEmpty4D(x, y, z, w)) {
              const pos: Vector4i = { x, y, z, w };
              board.makeMove(pos, humanSymbol);
              const evalScore = minimax4D(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
              board.undoMove(pos);

              minEval = Math.min(minEval, evalScore);
              beta = Math.min(beta, evalScore);
              if (beta <= alpha) return minEval;
            }
          }
        }
      }
    }
    return minEval;
  }
}

export function getBestMove4D(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 80% casilla aleatoria 4D
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 80) {
      const rand = getRandomMove4D(board);
      if (rand) return rand;
    }
    const winMove = findWinningOrBlockingMove4D(board, aiSymbol);
    if (winMove) return winMove;
    return getRandomMove4D(board) || { x: 1, y: 1, z: 1, w: 1 };
  } else if (difficulty === Difficulty.Medium) {
    // 1. Ganar de inmediato (70%)
    if (Math.random() * 100 <= 70) {
      const winMove = findWinningOrBlockingMove4D(board, aiSymbol);
      if (winMove) return winMove;
    }

    // 2. Bloquear victoria rival (60%)
    if (Math.random() * 100 <= 60) {
      const blockMove = findWinningOrBlockingMove4D(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // 3. Ocupar el hipercentro si está disponible (70%)
    if (board.isCellEmpty4D(1, 1, 1, 1) && Math.random() * 100 <= 70) {
      return { x: 1, y: 1, z: 1, w: 1 };
    }

    // 4. 35% jugada aleatoria
    if (Math.random() * 100 <= 35) {
      const rand = getRandomMove4D(board);
      if (rand) return rand;
    }

    // 5. Evaluación 1-ply en casillas libres
    let bestVal = -50000;
    const bestMoves: Vector4i[] = [];

    for (let x = 0; x < 3; ++x) {
      for (let y = 0; y < 3; ++y) {
        for (let z = 0; z < 3; ++z) {
          for (let w = 0; w < 3; ++w) {
            if (board.isCellEmpty4D(x, y, z, w)) {
              const pos: Vector4i = { x, y, z, w };
              board.makeMove(pos, aiSymbol);
              const moveVal = evaluateBoard4D(board, aiSymbol, humanSymbol);
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
      }
    }

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return getRandomMove4D(board) || { x: 1, y: 1, z: 1, w: 1 };
  }

  // Modo Difícil (Hard): 100% óptimo con detección en 272 líneas y minimax 4D
  const winMove = findWinningOrBlockingMove4D(board, aiSymbol);
  if (winMove) return winMove;

  const blockMove = findWinningOrBlockingMove4D(board, humanSymbol);
  if (blockMove) return blockMove;

  // Ocupar hipercentro si está libre
  if (board.isCellEmpty4D(1, 1, 1, 1)) {
    return { x: 1, y: 1, z: 1, w: 1 };
  }

  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];

  for (let x = 0; x < 3; ++x) {
    for (let y = 0; y < 3; ++y) {
      for (let z = 0; z < 3; ++z) {
        for (let w = 0; w < 3; ++w) {
          if (board.isCellEmpty4D(x, y, z, w)) {
            const pos: Vector4i = { x, y, z, w };
            board.makeMove(pos, aiSymbol);
            const moveVal = minimax4D(board, 0, false, aiSymbol, humanSymbol, -50000, 50000);
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
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return getRandomMove4D(board) || { x: 1, y: 1, z: 1, w: 1 };
}
