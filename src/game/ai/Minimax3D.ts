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

// Valor posicional topológico de casillas en el cubo 3x3x3
function getCellStrategicWeight3D(r: number, c: number, z: number): number {
  // Centro absoluto (1,1,1): participa en 13 líneas ganadoras
  if (r === 1 && c === 1 && z === 1) return 50;
  // 8 esquinas: participan en 7 líneas cada una
  const isCornerR = r === 0 || r === 2;
  const isCornerC = c === 0 || c === 2;
  const isCornerZ = z === 0 || z === 2;
  if (isCornerR && isCornerC && isCornerZ) return 22;
  // 6 centros de cara: participan en 4 líneas
  const midCount = (r === 1 ? 1 : 0) + (c === 1 ? 1 : 0) + (z === 1 ? 1 : 0);
  if (midCount === 2) return 12;
  // 12 aristas intermedias: participan en 3 líneas
  return 6;
}

export function getCandidateMoves3D(board: BoardModel): Vector4i[] {
  const candidates: { pos: Vector4i; weight: number }[] = [];
  for (let z = 0; z < 3; ++z) {
    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (board.isCellEmpty3D(r, c, z)) {
          const pos: Vector4i = { x: r, y: c, z, w: 0 };
          candidates.push({ pos, weight: getCellStrategicWeight3D(r, c, z) });
        }
      }
    }
  }
  // Ordenar de mayor a menor peso estratégico para maximizar cortes alfa-beta
  candidates.sort((a, b) => b.weight - a.weight);
  return candidates.map((c) => c.pos);
}

function minimax3D(
  board: BoardModel,
  depth: number,
  maxDepth: number,
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

  if (depth >= maxDepth) {
    return evaluateBoard3D(board, aiSymbol, humanSymbol);
  }

  const moves = getCandidateMoves3D(board);
  if (moves.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -50000;
    for (const pos of moves) {
      board.makeMove(pos, aiSymbol);
      const evalScore = minimax3D(board, depth + 1, maxDepth, false, aiSymbol, humanSymbol, alpha, beta);
      board.undoMove(pos);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = 50000;
    for (const pos of moves) {
      board.makeMove(pos, humanSymbol);
      const evalScore = minimax3D(board, depth + 1, maxDepth, true, aiSymbol, humanSymbol, alpha, beta);
      board.undoMove(pos);

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
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
  // 1. NIVEL FÁCIL: Para principiantes, con errores tácticos en diagonales cruzadas
  if (difficulty === Difficulty.Easy) {
    if (Math.random() * 100 <= 45) {
      const rand = getRandomMove3D(board);
      if (rand) return rand;
    }
    // 60% probabilidad de aprovechar victoria directa
    if (Math.random() * 100 <= 60) {
      const winMove = findWinningOrBlockingMove3D(board, aiSymbol);
      if (winMove) return winMove;
    }
    // 50% probabilidad de bloquear al rival
    if (Math.random() * 100 <= 50) {
      const blockMove = findWinningOrBlockingMove3D(board, humanSymbol);
      if (blockMove) return blockMove;
    }
    // Jugada posicional básica
    const moves = getCandidateMoves3D(board);
    if (moves.length > 0) return moves[0];
    return getRandomMove3D(board) || { x: 1, y: 1, z: 1, w: 0 };
  }

const CORNERS_3D: [number, number, number][] = [
  [0, 0, 0], [0, 2, 0], [2, 0, 0], [2, 2, 0],
  [0, 0, 2], [0, 2, 2], [2, 0, 2], [2, 2, 2],
];

function getOpeningMove3D(board: BoardModel): Vector4i | null {
  const occupied = board.getOccupiedCount();
  if (occupied > 2) return null;

  // 1. Centro absoluto del cubo (1,1,1) si está disponible (cruza 13 líneas ganadoras)
  if (board.isCellEmpty3D(1, 1, 1)) {
    return { x: 1, y: 1, z: 1, w: 0 };
  }

  // 2. Si el centro está ocupado (ej: el humano jugó centro en el turno 1):
  // Responder inmediatamente tomando una esquina estratégica libre (0 ms)
  const availableCorners = CORNERS_3D.filter(([r, c, z]) => board.isCellEmpty3D(r, c, z));
  if (availableCorners.length > 0) {
    const [cr, cc, cz] = availableCorners[Math.floor(Math.random() * availableCorners.length)];
    return { x: cr, y: cc, z: cz, w: 0 };
  }

  return null;
}

  // 2. NIVEL MEDIO: Juego táctico sólido, 100% de victorias inmediatas y 90% bloqueos
  if (difficulty === Difficulty.Medium) {
    // Apertura instantánea para los 2 primeros turnos (0 ms)
    const opening = getOpeningMove3D(board);
    if (opening) return opening;

    // Victoria inmediata garantizada
    const winMove = findWinningOrBlockingMove3D(board, aiSymbol);
    if (winMove) return winMove;

    // Bloqueo directo de amenaza rival (92% de consistencia)
    if (Math.random() * 100 <= 92) {
      const blockMove = findWinningOrBlockingMove3D(board, humanSymbol);
      if (blockMove) return blockMove;
    }

    // Evaluación Minimax a profundidad 2 con cálculo real de respuesta del oponente
    const candidates = getCandidateMoves3D(board);
    let bestVal = -50000;
    const bestMoves: Vector4i[] = [];

    for (const pos of candidates) {
      board.makeMove(pos, aiSymbol);
      const moveVal = minimax3D(board, 0, 2, false, aiSymbol, humanSymbol, -50000, 50000);
      board.undoMove(pos);

      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMoves.length = 0;
        bestMoves.push(pos);
      } else if (moveVal === bestVal) {
        bestMoves.push(pos);
      }
    }

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return getRandomMove3D(board) || { x: 1, y: 1, z: 1, w: 0 };
  }

  // 3. NIVEL DIFÍCIL (IMBATIBLE): Minimax Alpha-Beta profundo con libro de apertura instantáneo
  const opening = getOpeningMove3D(board);
  if (opening) return opening;

  const occupied = board.getOccupiedCount();

  // Victoria inmediata
  const winMove = findWinningOrBlockingMove3D(board, aiSymbol);
  if (winMove) return winMove;

  // Bloqueo de victoria rival
  const blockMove = findWinningOrBlockingMove3D(board, humanSymbol);
  if (blockMove) return blockMove;

  // Profundidad adaptativa: 3 niveles normalmente, 4 cuando quedan pocas casillas libres
  const emptyCount = 27 - occupied;
  const searchDepth = emptyCount <= 12 ? 4 : 3;

  const candidates = getCandidateMoves3D(board);
  let bestVal = -50000;
  const bestMoves: Vector4i[] = [];

  for (const pos of candidates) {
    board.makeMove(pos, aiSymbol);
    const moveVal = minimax3D(board, 0, searchDepth, false, aiSymbol, humanSymbol, -50000, 50000);
    board.undoMove(pos);

    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMoves.length = 0;
      bestMoves.push(pos);
    } else if (moveVal === bestVal) {
      bestMoves.push(pos);
    }
  }

  if (bestMoves.length > 0) {
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return getRandomMove3D(board) || { x: 1, y: 1, z: 1, w: 0 };
}
