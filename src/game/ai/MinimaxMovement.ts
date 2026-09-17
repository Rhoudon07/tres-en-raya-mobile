import { BoardModel } from '../board/BoardModel';
import { CellSymbol, MovementMove, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getWinningLineIndices } from '../board/WinningLines';

/**
 * Motor de IA para la modalidad Tres en Raya con Movimiento.
 * Maneja tanto la fase inicial de colocación (hasta 3 fichas c/u)
 * como la fase dinámica de desplazamiento adyacente (Morris/Tapatan).
 */

export function getBestPlacementMove(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): Vector4i {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) return { x: 0, y: 0, z: 0, w: 0 };

  if (difficulty === Difficulty.Easy) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 1. Ganar de inmediato si es posible
  for (const move of validMoves) {
    board.makeMove(move, aiSymbol);
    const win = board.checkWinner().winner === aiSymbol;
    board.undoMove(move);
    if (win) return move;
  }

  // 2. Bloquear victoria inminente del adversario
  for (const move of validMoves) {
    board.makeMove(move, humanSymbol);
    const oppWin = board.checkWinner().winner === humanSymbol;
    board.undoMove(move);
    if (oppWin) return move;
  }

  if (difficulty === Difficulty.Medium) {
    // Si el centro (1,1) está libre, tomarlo con alta probabilidad
    const center = validMoves.find((m) => m.x === 1 && m.y === 1);
    if (center && Math.random() < 0.8) return center;
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 3. Estrategia Hard: Prioridad táctica
  // Centro (1,1)
  const center = validMoves.find((m) => m.x === 1 && m.y === 1);
  if (center) return center;

  // Esquinas
  const corners = validMoves.filter(
    (m) => (m.x === 0 || m.x === 2) && (m.y === 0 || m.y === 2)
  );
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return validMoves[0];
}

export function getBestPieceMove(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty
): MovementMove {
  const validMoves = board.getValidPieceMoves(aiSymbol);
  if (validMoves.length === 0) {
    return {
      from: { x: 0, y: 0, z: 0, w: 0 },
      to: { x: 0, y: 0, z: 0, w: 0 },
    };
  }

  if (difficulty === Difficulty.Easy) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 1. Victoria inmediata en 1 movimiento
  for (const move of validMoves) {
    board.movePiece(move.from, move.to, aiSymbol);
    const win = board.checkWinner().winner === aiSymbol;
    board.undoPieceMove();
    if (win) return move;
  }

  // 2. Dificultad Medium: Bloqueo de amenazas inmediatas o movimiento seguro
  if (difficulty === Difficulty.Medium) {
    const oppMoves = board.getValidPieceMoves(humanSymbol);
    const oppWinningDestinations: Vector4i[] = [];
    for (const oppM of oppMoves) {
      board.movePiece(oppM.from, oppM.to, humanSymbol);
      if (board.checkWinner().winner === humanSymbol) {
        oppWinningDestinations.push(oppM.to);
      }
      board.undoPieceMove();
    }

    if (oppWinningDestinations.length > 0) {
      // Buscar si algún movimiento de la IA ocupa una de las casillas ganadoras del rival
      for (const m of validMoves) {
        if (oppWinningDestinations.some((d) => d.x === m.to.x && d.y === m.to.y)) {
          return m;
        }
      }
    }

    // Si no hay bloqueo crítico, mover al centro si está disponible
    const moveToCenter = validMoves.find((m) => m.to.x === 1 && m.to.y === 1);
    if (moveToCenter && Math.random() < 0.75) return moveToCenter;

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 3. Dificultad Hard: Búsqueda Alpha-Beta a profundidad 4
  const maxDepth = 4;
  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const move of validMoves) {
    board.movePiece(move.from, move.to, aiSymbol);

    // Si gana de inmediato
    if (board.checkWinner().winner === aiSymbol) {
      board.undoPieceMove();
      return move;
    }

    const score = minimax(board, maxDepth - 1, -Infinity, Infinity, false, aiSymbol, humanSymbol);
    board.undoPieceMove();

    // Pequeño jitter para evitar ciclos infinitos en posiciones de empate simétrico
    const jitter = (Math.random() - 0.5) * 2;
    const finalScore = score + jitter;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMove = move;
    }
  }

  return bestMove;
}

function evaluatePosition(board: BoardModel, aiSymbol: CellSymbol, humanSymbol: CellSymbol): number {
  const winner = board.checkWinner().winner;
  if (winner === aiSymbol) return 10000;
  if (winner === humanSymbol) return -10000;

  let score = 0;

  // 1. Control del centro (1,1): casilla clave con 8 adyacencias
  const centerSymbol = board.getCell2D(1, 1);
  if (centerSymbol === aiSymbol) score += 60;
  else if (centerSymbol === humanSymbol) score -= 60;

  // 2. Movilidad táctica (número de jugadas legales disponibles)
  const aiMobility = board.getValidPieceMoves(aiSymbol).length;
  const humanMobility = board.getValidPieceMoves(humanSymbol).length;

  if (humanMobility === 0) return 9000; // Rival inmovilizado / bloqueado
  if (aiMobility === 0) return -9000;   // IA inmovilizada / bloqueada

  score += (aiMobility - humanMobility) * 15;

  // 3. Amenazas potenciales en líneas ganadoras
  const lineIndices = getWinningLineIndices(board.type);
  for (let l = 0; l < lineIndices.length; ++l) {
    const idxs = lineIndices[l];
    let aiCount = 0;
    let humanCount = 0;
    let emptyCount = 0;

    for (let i = 0; i < 3; ++i) {
      const s = board.getCell({ x: idxs[i] % 5, y: Math.floor((idxs[i] % 25) / 5), z: 0, w: 0 });
      if (s === aiSymbol) aiCount++;
      else if (s === humanSymbol) humanCount++;
      else emptyCount++;
    }

    if (aiCount === 2 && emptyCount === 1) score += 150;
    if (humanCount === 2 && emptyCount === 1) score -= 200;
  }

  return score;
}

function minimax(
  board: BoardModel,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol
): number {
  const winner = board.checkWinner().winner;
  if (winner === aiSymbol) return 10000 + depth * 50;
  if (winner === humanSymbol) return -10000 - depth * 50;
  if (depth <= 0) return evaluatePosition(board, aiSymbol, humanSymbol);

  const currentSymbol = isMaximizing ? aiSymbol : humanSymbol;
  const moves = board.getValidPieceMoves(currentSymbol);

  if (moves.length === 0) {
    // Si el jugador actual no tiene movimientos válidos, está inmovilizado y pierde
    return isMaximizing ? -9000 - depth * 50 : 9000 + depth * 50;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      board.movePiece(move.from, move.to, aiSymbol);
      const evalScore = minimax(board, depth - 1, alpha, beta, false, aiSymbol, humanSymbol);
      board.undoPieceMove();

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Poda Beta
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      board.movePiece(move.from, move.to, humanSymbol);
      const evalScore = minimax(board, depth - 1, alpha, beta, true, aiSymbol, humanSymbol);
      board.undoPieceMove();

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Poda Alpha
    }
    return minEval;
  }
}
