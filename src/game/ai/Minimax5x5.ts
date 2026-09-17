import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

export function findWinningOrBlockingMove5x5(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  for (let r = 0; r < 5; ++r) {
    for (let c = 0; c < 5; ++c) {
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

export function getRandomMove5x5(board: BoardModel): Vector4i | null {
  const emptyCells: Vector4i[] = [];
  for (let r = 0; r < 5; ++r) {
    for (let c = 0; c < 5; ++c) {
      if (board.isCellEmpty2D(r, c)) {
        emptyCells.push({ x: r, y: c, z: 0, w: 0 });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function evaluateLine5x5(
  c1: CellSymbol,
  c2: CellSymbol,
  c3: CellSymbol,
  c4: CellSymbol,
  c5: CellSymbol,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  let aiCount = 0;
  let humanCount = 0;

  const cells = [c1, c2, c3, c4, c5];
  for (const c of cells) {
    if (c === aiSymbol) aiCount++;
    else if (c === humanSymbol) humanCount++;
  }

  // Si ambos tienen fichas en la línea, nadie puede ganarla
  if (aiCount > 0 && humanCount > 0) return 0;

  if (humanCount === 0) {
    if (aiCount === 5) return 10000;
    if (aiCount === 4) return 200;
    if (aiCount === 3) return 25;
    if (aiCount === 2) return 5;
    if (aiCount === 1) return 1;
  } else if (aiCount === 0) {
    if (humanCount === 5) return -10000;
    if (humanCount === 4) return -250;
    if (humanCount === 3) return -30;
    if (humanCount === 2) return -6;
    if (humanCount === 1) return -1;
  }

  return 0;
}

export function evaluateBoard5x5(board: BoardModel, aiSymbol: CellSymbol, humanSymbol: CellSymbol): number {
  let score = 0;

  // 1. Filas (5)
  for (let r = 0; r < 5; ++r) {
    score += evaluateLine5x5(
      board.getCell2D(r, 0),
      board.getCell2D(r, 1),
      board.getCell2D(r, 2),
      board.getCell2D(r, 3),
      board.getCell2D(r, 4),
      aiSymbol,
      humanSymbol
    );
  }

  // 2. Columnas (5)
  for (let c = 0; c < 5; ++c) {
    score += evaluateLine5x5(
      board.getCell2D(0, c),
      board.getCell2D(1, c),
      board.getCell2D(2, c),
      board.getCell2D(3, c),
      board.getCell2D(4, c),
      aiSymbol,
      humanSymbol
    );
  }

  // 3. Diagonales principales (2)
  score += evaluateLine5x5(
    board.getCell2D(0, 0),
    board.getCell2D(1, 1),
    board.getCell2D(2, 2),
    board.getCell2D(3, 3),
    board.getCell2D(4, 4),
    aiSymbol,
    humanSymbol
  );
  score += evaluateLine5x5(
    board.getCell2D(0, 4),
    board.getCell2D(1, 3),
    board.getCell2D(2, 2),
    board.getCell2D(3, 1),
    board.getCell2D(4, 0),
    aiSymbol,
    humanSymbol
  );

  // 4. Bonificación posicional del centro neurálgico (2,2)
  const centerCell = board.getCell2D(2, 2);
  if (centerCell === aiSymbol) score += 12;
  else if (centerCell === humanSymbol) score -= 12;

  // 5. Bonificación del anillo interior (distancia Manhattan <= 2 del centro)
  const innerRing = [
    { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 },
    { x: 2, y: 1 },                 { x: 2, y: 3 },
    { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
  ];
  for (const pt of innerRing) {
    const cell = board.getCell2D(pt.x, pt.y);
    if (cell === aiSymbol) score += 3;
    else if (cell === humanSymbol) score -= 3;
  }

  return score;
}

// Celdas ordenadas estratégicamente desde el centro hacia afuera para maximizar cortes alfa-beta
const STRATEGIC_CELL_ORDER_5X5: Vector4i[] = [
  // Centro
  { x: 2, y: 2, z: 0, w: 0 },
  // Anillo 1
  { x: 1, y: 1, z: 0, w: 0 }, { x: 1, y: 2, z: 0, w: 0 }, { x: 1, y: 3, z: 0, w: 0 },
  { x: 2, y: 1, z: 0, w: 0 },                             { x: 2, y: 3, z: 0, w: 0 },
  { x: 3, y: 1, z: 0, w: 0 }, { x: 3, y: 2, z: 0, w: 0 }, { x: 3, y: 3, z: 0, w: 0 },
  // Anillo 2 (Esquinas y bordes)
  { x: 0, y: 0, z: 0, w: 0 }, { x: 0, y: 4, z: 0, w: 0 },
  { x: 4, y: 0, z: 0, w: 0 }, { x: 4, y: 4, z: 0, w: 0 },
  { x: 0, y: 2, z: 0, w: 0 }, { x: 4, y: 2, z: 0, w: 0 },
  { x: 2, y: 0, z: 0, w: 0 }, { x: 2, y: 4, z: 0, w: 0 },
  { x: 0, y: 1, z: 0, w: 0 }, { x: 0, y: 3, z: 0, w: 0 },
  { x: 1, y: 0, z: 0, w: 0 }, { x: 1, y: 4, z: 0, w: 0 },
  { x: 3, y: 0, z: 0, w: 0 }, { x: 3, y: 4, z: 0, w: 0 },
  { x: 4, y: 1, z: 0, w: 0 }, { x: 4, y: 3, z: 0, w: 0 },
];

function minimax5x5(
  board: BoardModel,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  alpha: number,
  beta: number,
  maxDepth: number
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 10000 - depth;
  if (winner === humanSymbol) return depth - 10000;
  if (winner === 'D') return 0;

  if (depth >= maxDepth) {
    return evaluateBoard5x5(board, aiSymbol, humanSymbol);
  }

  if (isMaximizing) {
    let maxEval = -50000;
    for (const pos of STRATEGIC_CELL_ORDER_5X5) {
      if (board.isCellEmpty2D(pos.x, pos.y)) {
        board.makeMove(pos, aiSymbol);
        const evalScore = minimax5x5(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta, maxDepth);
        board.undoMove(pos);

        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = 50000;
    for (const pos of STRATEGIC_CELL_ORDER_5X5) {
      if (board.isCellEmpty2D(pos.x, pos.y)) {
        board.makeMove(pos, humanSymbol);
        const evalScore = minimax5x5(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta, maxDepth);
        board.undoMove(pos);

        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

export function getBestMove5x5(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  // Nivel Fácil: 75% movimiento aleatorio, 25% evaluación táctica
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 75) {
      const rand = getRandomMove5x5(board);
      if (rand) return rand;
    }
    const winMove = findWinningOrBlockingMove5x5(board, aiSymbol);
    if (winMove) return winMove;
    return getRandomMove5x5(board) || { x: 2, y: 2, z: 0, w: 0 };
  } else if (difficulty === Difficulty.Medium) {
    // 1. Ganar si existe jugada servida (85%)
    if (Math.random() * 100 <= 85) {
      const winMove = findWinningOrBlockingMove5x5(board, aiSymbol);
      if (winMove) return winMove;
    }

    // 2. Bloquear victoria del rival (75%)
    if (Math.random() * 100 <= 75) {
      const blockMove = findWinningOrBlockingMove5x5(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // 3. Probabilidad de jugada aleatoria (30%)
    if (Math.random() * 100 <= 30) {
      const rand = getRandomMove5x5(board);
      if (rand) return rand;
    }

    // 4. Minimax a profundidad 2
    let bestVal = -50000;
    const bestMoves: Vector4i[] = [];

    for (const pos of STRATEGIC_CELL_ORDER_5X5) {
      if (board.isCellEmpty2D(pos.x, pos.y)) {
        board.makeMove(pos, aiSymbol);
        const moveVal = minimax5x5(board, 1, false, aiSymbol, humanSymbol, -50000, 50000, 2);
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
    return getRandomMove5x5(board) || { x: 2, y: 2, z: 0, w: 0 };
  }

  // Modo Difícil (Hard): 100% óptimo
  // 1. Victoria inmediata
  const winMove = findWinningOrBlockingMove5x5(board, aiSymbol);
  if (winMove) return winMove;

  // 2. Bloqueo inmediato
  const blockMove = findWinningOrBlockingMove5x5(board, humanSymbol);
  if (blockMove) return blockMove;

  const occupied = board.getOccupiedCount();

  // 3. Libro de aperturas para el primer turno
  if (occupied === 0) {
    return { x: 2, y: 2, z: 0, w: 0 }; // Siempre tomar el centro absoluto
  }
  if (occupied === 1) {
    if (board.isCellEmpty2D(2, 2)) {
      return { x: 2, y: 2, z: 0, w: 0 };
    }
    // Si el rival tomó el centro, tomar una diagonal fuerte
    const strongDiagonals = [
      { x: 1, y: 1, z: 0, w: 0 },
      { x: 1, y: 3, z: 0, w: 0 },
      { x: 3, y: 1, z: 0, w: 0 },
      { x: 3, y: 3, z: 0, w: 0 },
    ];
    return strongDiagonals[Math.floor(Math.random() * strongDiagonals.length)];
  }

  // 4. Minimax con profundidad adaptativa optimizada para respuesta táctica instantánea
  const maxDepth = occupied >= 16 ? 3 : 2;
  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];

  for (const pos of STRATEGIC_CELL_ORDER_5X5) {
    if (board.isCellEmpty2D(pos.x, pos.y)) {
      board.makeMove(pos, aiSymbol);
      const moveVal = minimax5x5(board, 0, false, aiSymbol, humanSymbol, -50000, 50000, maxDepth);
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

  return getRandomMove5x5(board) || { x: 2, y: 2, z: 0, w: 0 };
}
