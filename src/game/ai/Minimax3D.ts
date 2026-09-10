import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getWinningLines } from '../board/WinningLines';
import { BoardType } from '../../types/board';

export function findWinningOrBlockingMove3D(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  for (let z = 0; z < 3; ++z) {
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
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

export function getRandomMove3D(board: BoardModel): Vector4i | null {
  const emptyCells: Vector4i[] = [];
  for (let z = 0; z < 3; ++z) {
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (board.isCellEmpty3D(r, c, z)) {
          emptyCells.push({ x: r, y: c, z, w: 0 });
        }
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function evaluateLine3D(
  c1: CellSymbol,
  c2: CellSymbol,
  c3: CellSymbol,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  let aiCount = 0;
  let humanCount = 0;

  const cells = [c1, c2, c3];
  for (const c of cells) {
    if (c === aiSymbol) aiCount++;
    else if (c === humanSymbol) humanCount++;
  }

  if (aiCount > 0 && humanCount > 0) return 0;

  if (humanCount === 0) {
    if (aiCount === 3) return 10000;
    if (aiCount === 2) return 120;
    if (aiCount === 1) return 10;
  } else if (aiCount === 0) {
    if (humanCount === 3) return -10000;
    if (humanCount === 2) return -150;
    if (humanCount === 1) return -10;
  }

  return 0;
}

export function evaluateBoard3D(board: BoardModel, aiSymbol: CellSymbol, humanSymbol: CellSymbol): number {
  let score = 0;
  const lines = getWinningLines(BoardType.TicTacToe3D);

  for (const line of lines) {
    score += evaluateLine3D(
      board.getCell(line[0]),
      board.getCell(line[1]),
      board.getCell(line[2]),
      aiSymbol,
      humanSymbol
    );
  }

  // Bonificación topológica: Centro absoluto del cubo (1, 1, 1)
  const centerCell = board.getCell3D(1, 1, 1);
  if (centerCell === aiSymbol) score += 35;
  else if (centerCell === humanSymbol) score -= 35;

  // Bonificación de esquinas (8 esquinas del cubo)
  const corners: [number, number, number][] = [
    [0, 0, 0], [0, 2, 0], [2, 0, 0], [2, 2, 0],
    [0, 0, 2], [0, 2, 2], [2, 0, 2], [2, 2, 2],
  ];
  for (const [r, c, z] of corners) {
    const cell = board.getCell3D(r, c, z);
    if (cell === aiSymbol) score += 8;
    else if (cell === humanSymbol) score -= 8;
  }

  return score;
}

function minimax3D(
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
    return evaluateBoard3D(board, aiSymbol, humanSymbol);
  }

  if (isMaximizing) {
    let maxEval = -50000;
    for (let z = 0; z < 3; ++z) {
      for (let r = 0; r < 3; ++r) {
        for (let c = 0; c < 3; ++c) {
          if (board.isCellEmpty3D(r, c, z)) {
            const pos: Vector4i = { x: r, y: c, z, w: 0 };
            board.makeMove(pos, aiSymbol);
            const evalScore = minimax3D(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
            board.undoMove(pos);

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
          }
        }
      }
    }
    return maxEval;
  } else {
    let minEval = 50000;
    for (let z = 0; z < 3; ++z) {
      for (let r = 0; r < 3; ++r) {
        for (let c = 0; c < 3; ++c) {
          if (board.isCellEmpty3D(r, c, z)) {
            const pos: Vector4i = { x: r, y: c, z, w: 0 };
            board.makeMove(pos, humanSymbol);
            const evalScore = minimax3D(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
            board.undoMove(pos);

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
          }
        }
      }
    }
    return minEval;
  }
}

export function getBestMove3D(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 75% casilla 3D aleatoria
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 75) {
      const rand = getRandomMove3D(board);
      if (rand) return rand;
    }
    const winMove = findWinningOrBlockingMove3D(board, aiSymbol);
    if (winMove) return winMove;
    return getRandomMove3D(board) || { x: 1, y: 1, z: 1, w: 0 };
  } else if (difficulty === Difficulty.Medium) {
    // 1. Ganar si existe jugada directa (75%)
    if (Math.random() * 100 <= 75) {
      const winMove = findWinningOrBlockingMove3D(board, aiSymbol);
      if (winMove) return winMove;
    }

    // 2. Bloquear victoria rival (65%)
    if (Math.random() * 100 <= 65) {
      const blockMove = findWinningOrBlockingMove3D(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // 3. Tomar el centro del cubo si está libre (70%)
    if (board.isCellEmpty3D(1, 1, 1) && Math.random() * 100 <= 70) {
      return { x: 1, y: 1, z: 1, w: 0 };
    }

    // 4. 35% jugada aleatoria
    if (Math.random() * 100 <= 35) {
      const rand = getRandomMove3D(board);
      if (rand) return rand;
    }

    // 5. Minimax depth 2
    let bestVal = -50000;
    const bestMoves: Vector4i[] = [];

    for (let z = 0; z < 3; ++z) {
      for (let r = 0; r < 3; ++r) {
        for (let c = 0; c < 3; ++c) {
          if (board.isCellEmpty3D(r, c, z)) {
            const pos: Vector4i = { x: r, y: c, z, w: 0 };
            board.makeMove(pos, aiSymbol);
            const moveVal = minimax3D(board, 2, false, aiSymbol, humanSymbol, -50000, 50000);
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

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return getRandomMove3D(board) || { x: 1, y: 1, z: 1, w: 0 };
  }

  // Modo Difícil (Hard): 100% óptimo con Minimax 3D y control de centro
  const occupied = board.getOccupiedCount();
  if (occupied === 0) return { x: 1, y: 1, z: 1, w: 0 };
  if (occupied === 1 && board.isCellEmpty3D(1, 1, 1)) return { x: 1, y: 1, z: 1, w: 0 };

  const winMove = findWinningOrBlockingMove3D(board, aiSymbol);
  if (winMove) return winMove;

  const blockMove = findWinningOrBlockingMove3D(board, humanSymbol);
  if (blockMove) return blockMove;

  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];

  for (let z = 0; z < 3; ++z) {
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (board.isCellEmpty3D(r, c, z)) {
          const pos: Vector4i = { x: r, y: c, z, w: 0 };
          board.makeMove(pos, aiSymbol);
          const moveVal = minimax3D(board, 0, false, aiSymbol, humanSymbol, -50000, 50000);
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

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return getRandomMove3D(board) || { x: 1, y: 1, z: 1, w: 0 };
}
