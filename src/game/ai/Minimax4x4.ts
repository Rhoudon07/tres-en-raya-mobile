import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

export function findWinningOrBlockingMove4x4(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  for (let r = 0; r < 4; ++r) {
    for (let c = 0; c < 4; ++c) {
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

export function getRandomMove4x4(board: BoardModel): Vector4i | null {
  const emptyCells: Vector4i[] = [];
  for (let r = 0; r < 4; ++r) {
    for (let c = 0; c < 4; ++c) {
      if (board.isCellEmpty2D(r, c)) {
        emptyCells.push({ x: r, y: c, z: 0, w: 0 });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function evaluateLine4x4(
  c1: CellSymbol,
  c2: CellSymbol,
  c3: CellSymbol,
  c4: CellSymbol,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
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
    if (aiCount === 3) return 100;
    if (aiCount === 2) return 10;
    if (aiCount === 1) return 1;
  } else if (aiCount === 0) {
    if (humanCount === 4) return -10000;
    if (humanCount === 3) return -120;
    if (humanCount === 2) return -12;
    if (humanCount === 1) return -1;
  }

  return 0;
}

export function evaluateBoard4x4(board: BoardModel, aiSymbol: CellSymbol, humanSymbol: CellSymbol): number {
  let score = 0;

  // 1. Filas (4)
  for (let r = 0; r < 4; ++r) {
    score += evaluateLine4x4(
      board.getCell2D(r, 0),
      board.getCell2D(r, 1),
      board.getCell2D(r, 2),
      board.getCell2D(r, 3),
      aiSymbol,
      humanSymbol
    );
  }

  // 2. Columnas (4)
  for (let c = 0; c < 4; ++c) {
    score += evaluateLine4x4(
      board.getCell2D(0, c),
      board.getCell2D(1, c),
      board.getCell2D(2, c),
      board.getCell2D(3, c),
      aiSymbol,
      humanSymbol
    );
  }

  // 3. Diagonales (2)
  score += evaluateLine4x4(
    board.getCell2D(0, 0),
    board.getCell2D(1, 1),
    board.getCell2D(2, 2),
    board.getCell2D(3, 3),
    aiSymbol,
    humanSymbol
  );
  score += evaluateLine4x4(
    board.getCell2D(0, 3),
    board.getCell2D(1, 2),
    board.getCell2D(2, 1),
    board.getCell2D(3, 0),
    aiSymbol,
    humanSymbol
  );

  // 4. Control del centro (casillas 1,1 - 1,2 - 2,1 - 2,2)
  const centers = [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ];
  for (const pt of centers) {
    const cell = board.getCell2D(pt.x, pt.y);
    if (cell === aiSymbol) score += 4;
    else if (cell === humanSymbol) score -= 4;
  }

  return score;
}

function minimax4x4(
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

  if (depth >= 3) {
    return evaluateBoard4x4(board, aiSymbol, humanSymbol);
  }

  if (isMaximizing) {
    let maxEval = -50000;
    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        if (board.isCellEmpty2D(r, c)) {
          const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
          board.makeMove(pos, aiSymbol);
          const evalScore = minimax4x4(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
          board.undoMove(pos);

          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = 50000;
    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        if (board.isCellEmpty2D(r, c)) {
          const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
          board.makeMove(pos, humanSymbol);
          const evalScore = minimax4x4(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
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

export function getBestMove4x4(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 75% movimiento aleatorio, 25% evaluación superficial
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 75) {
      const rand = getRandomMove4x4(board);
      if (rand) return rand;
    }
    const winMove = findWinningOrBlockingMove4x4(board, aiSymbol);
    if (winMove) return winMove;
    return getRandomMove4x4(board) || { x: 0, y: 0, z: 0, w: 0 };
  } else if (difficulty === Difficulty.Medium) {
    // 1. Ganar si existe jugada servida (85%)
    if (Math.random() * 100 <= 85) {
      const winMove = findWinningOrBlockingMove4x4(board, aiSymbol);
      if (winMove) return winMove;
    }

    // 2. Bloquear victoria del rival (75%)
    if (Math.random() * 100 <= 75) {
      const blockMove = findWinningOrBlockingMove4x4(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // 3. Probabilidad de jugada aleatoria (35%)
    if (Math.random() * 100 <= 35) {
      const rand = getRandomMove4x4(board);
      if (rand) return rand;
    }

    // 4. Minimax con profundidad 2
    let bestVal = -50000;
    const bestMoves: Vector4i[] = [];

    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        if (board.isCellEmpty2D(r, c)) {
          const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
          board.makeMove(pos, aiSymbol);
          const moveVal = minimax4x4(board, 2, false, aiSymbol, humanSymbol, -50000, 50000);
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
    return getRandomMove4x4(board) || { x: 0, y: 0, z: 0, w: 0 };
  }

  // Modo Difícil (Hard): 100% óptimo con detección inmediata y minimax depth 3
  const winMove = findWinningOrBlockingMove4x4(board, aiSymbol);
  if (winMove) return winMove;

  const blockMove = findWinningOrBlockingMove4x4(board, humanSymbol);
  if (blockMove) return blockMove;

  const occupied = board.getOccupiedCount();
  if (occupied === 0) {
    const centralOpenings: Vector4i[] = [
      { x: 1, y: 1, z: 0, w: 0 },
      { x: 1, y: 2, z: 0, w: 0 },
      { x: 2, y: 1, z: 0, w: 0 },
      { x: 2, y: 2, z: 0, w: 0 },
    ];
    return centralOpenings[Math.floor(Math.random() * centralOpenings.length)];
  }

  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];

  for (let r = 0; r < 4; ++r) {
    for (let c = 0; c < 4; ++c) {
      if (board.isCellEmpty2D(r, c)) {
        const pos: Vector4i = { x: r, y: c, z: 0, w: 0 };
        board.makeMove(pos, aiSymbol);
        const moveVal = minimax4x4(board, 0, false, aiSymbol, humanSymbol, -50000, 50000);
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

  return getRandomMove4x4(board) || { x: 0, y: 0, z: 0, w: 0 };
}
