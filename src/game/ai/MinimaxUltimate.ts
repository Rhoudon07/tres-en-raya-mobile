import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

// Coordenadas relativas de las 8 líneas ganadoras en un mini-tablero 3x3
const MINI_LINES: [number, number, number][] = [
  [0, 5, 10], // fila 0
  [1, 6, 11], // fila 1
  [2, 7, 12], // fila 2
  [0, 1, 2],  // col 0
  [5, 6, 7],  // col 1
  [10, 11, 12], // col 2
  [0, 6, 12], // diag 1
  [2, 6, 10], // diag 2
];

// Las 8 líneas ganadoras del macro-tablero 3x3
const MACRO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
  [0, 4, 8], [2, 4, 6],           // diagonales
];

/**
 * Evalúa estáticamente una posición de Ultimate Tic-Tac-Toe.
 */
function evaluateUltimatePosition(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 100000;
  if (winner === humanSymbol) return -100000;
  if (winner === 'D') return 0;

  let score = 0;

  // 1. Evaluación del macro-tablero
  for (const line of MACRO_LINES) {
    let aiCount = 0;
    let humanCount = 0;
    let emptyCount = 0;

    for (const m of line) {
      const s = board.macroBoard[m];
      if (s === aiSymbol) aiCount++;
      else if (s === humanSymbol) humanCount++;
      else if (s === ' ') emptyCount++;
    }

    if (aiCount === 2 && emptyCount === 1) score += 1800;
    else if (humanCount === 2 && emptyCount === 1) score -= 1800;
    else if (aiCount === 1 && emptyCount === 2) score += 200;
    else if (humanCount === 1 && emptyCount === 2) score -= 200;
  }

  // Mini-tableros conquistados y control posicional
  if (board.macroBoard[4] === aiSymbol) score += 800;
  else if (board.macroBoard[4] === humanSymbol) score -= 800;

  const corners = [0, 2, 6, 8];
  for (const c of corners) {
    if (board.macroBoard[c] === aiSymbol) score += 250;
    else if (board.macroBoard[c] === humanSymbol) score -= 250;
  }

  // 2. Evaluación táctica de los mini-tableros no cerrados
  for (let m = 0; m < 9; ++m) {
    const macroWinner = board.macroBoard[m];
    if (macroWinner === aiSymbol) {
      score += 1000;
      continue;
    }
    if (macroWinner === humanSymbol) {
      score -= 1000;
      continue;
    }
    if (macroWinner === 'D') continue;

    // Mini-tablero aún en disputa: evaluar amenazas locales
    const base = (m % 3) * 25 + Math.floor(m / 3) * 100;
    for (const line of MINI_LINES) {
      const c1 = board['cells'][base + line[0]];
      const c2 = board['cells'][base + line[1]];
      const c3 = board['cells'][base + line[2]];

      let a = 0;
      let h = 0;
      let e = 0;
      if (c1 === aiSymbol) a++; else if (c1 === humanSymbol) h++; else e++;
      if (c2 === aiSymbol) a++; else if (c2 === humanSymbol) h++; else e++;
      if (c3 === aiSymbol) a++; else if (c3 === humanSymbol) h++; else e++;

      if (a === 2 && e === 1) score += 120;
      else if (h === 2 && e === 1) score -= 120;
      else if (a === 1 && e === 2) score += 15;
      else if (h === 1 && e === 2) score -= 15;
    }

    // Control del centro local (1,1)
    const centerCell = board['cells'][base + 6]; // (1,1) -> 1 + 1*5 = 6
    if (centerCell === aiSymbol) score += 25;
    else if (centerCell === humanSymbol) score -= 25;
  }

  return score;
}

/**
 * Ordena las jugadas candidatas para maximizar la poda Alpha-Beta.
 */
function orderUltimateMoves(
  board: BoardModel,
  moves: Vector4i[],
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): Vector4i[] {
  return moves.slice().sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Centro micro
    if (a.x === 1 && a.y === 1) scoreA += 50;
    if (b.x === 1 && b.y === 1) scoreB += 50;

    // Centro macro (mini-tablero 4)
    if (a.w === 1 && a.z === 1) scoreA += 40;
    if (b.w === 1 && b.z === 1) scoreB += 40;

    const targetA = a.x * 3 + a.y;
    const targetB = b.x * 3 + b.y;

    // Enviar al rival a un tablero cerrado le da turno libre -> ligera penalización
    if (board.macroBoard[targetA] !== ' ' || board.isMiniBoardFull(targetA)) scoreA -= 100;
    if (board.macroBoard[targetB] !== ' ' || board.isMiniBoardFull(targetB)) scoreB -= 100;

    return scoreB - scoreA;
  });
}

/**
 * Búsqueda Alpha-Beta con profundidad limitada para Ultimate Tic-Tac-Toe.
 */
function alphaBetaUltimate(
  board: BoardModel,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) return 100000 + depth;
  if (winner === humanSymbol) return -100000 - depth;
  if (winner === 'D') return 0;
  if (depth === 0) {
    return evaluateUltimatePosition(board, aiSymbol, humanSymbol);
  }

  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return 0;

  const currentSymbol = isMaximizing ? aiSymbol : humanSymbol;
  const orderedMoves = orderUltimateMoves(board, validMoves, aiSymbol, humanSymbol);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      board.makeMove(move, currentSymbol);
      const evalScore = alphaBetaUltimate(board, depth - 1, alpha, beta, false, aiSymbol, humanSymbol);
      board.undoMove(move);

      if (evalScore > maxEval) maxEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break; // Poda Beta
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      board.makeMove(move, currentSymbol);
      const evalScore = alphaBetaUltimate(board, depth - 1, alpha, beta, true, aiSymbol, humanSymbol);
      board.undoMove(move);

      if (evalScore < minEval) minEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break; // Poda Alpha
    }
    return minEval;
  }
}

/**
 * Obtiene el mejor movimiento para la IA en Ultimate Tic-Tac-Toe.
 */
export function getBestMoveUltimate(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty = Difficulty.Hard
): Vector4i {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) {
    return { x: 0, y: 0, z: 0, w: 0 };
  }
  if (validMoves.length === 1) {
    return validMoves[0];
  }

  // 1. Detección inmediata de victoria global (Profundidad 1)
  for (const move of validMoves) {
    board.makeMove(move, aiSymbol);
    const { winner } = board.checkWinner();
    board.undoMove(move);
    if (winner === aiSymbol) {
      return move;
    }
  }

  // 2. Detección inmediata de bloqueo de victoria global del rival (Profundidad 1)
  for (const move of validMoves) {
    board.makeMove(move, humanSymbol);
    const { winner } = board.checkWinner();
    board.undoMove(move);
    if (winner === humanSymbol) {
      return move;
    }
  }

  // 3. Detección de jugada que gana el mini-tablero actual
  for (const move of validMoves) {
    const macroIdx = move.w * 3 + move.z;
    board.makeMove(move, aiSymbol);
    const won = board.getMiniBoardWinner(macroIdx) === aiSymbol;
    board.undoMove(move);
    if (won) {
      // Si además no le regala una victoria inmediata al rival, priorizar
      return move;
    }
  }

  // 4. Bloqueo de victoria inminente del rival en el mini-tablero actual
  for (const move of validMoves) {
    const macroIdx = move.w * 3 + move.z;
    board.makeMove(move, humanSymbol);
    const rivalWon = board.getMiniBoardWinner(macroIdx) === humanSymbol;
    board.undoMove(move);
    if (rivalWon) {
      return move;
    }
  }

  // 5. Nivel Fácil: 40% jugada aleatoria legal, 60% centro/esquinas
  if (difficulty === Difficulty.Easy) {
    const rand = Math.random();
    if (rand < 0.4) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  // 6. Nivel Medio: Alpha-Beta a profundidad 2
  // 7. Nivel Difícil: Alpha-Beta a profundidad 3
  const searchDepth = difficulty === Difficulty.Hard ? 3 : 2;
  const orderedMoves = orderUltimateMoves(board, validMoves, aiSymbol, humanSymbol);

  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of orderedMoves) {
    board.makeMove(move, aiSymbol);
    const score = alphaBetaUltimate(board, searchDepth - 1, alpha, beta, false, aiSymbol, humanSymbol);
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
