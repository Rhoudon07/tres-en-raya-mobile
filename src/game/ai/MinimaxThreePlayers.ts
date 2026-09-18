import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';

/**
 * Obtiene los dos oponentes de la IA en orden estricto de rotación de turno.
 * Turno cíclico: X -> O -> Y -> X
 */
export function getOpponentsThreePlayers(aiSymbol: CellSymbol): {
  nextOpponent: CellSymbol;
  thirdOpponent: CellSymbol;
} {
  if (aiSymbol === 'X') {
    return { nextOpponent: 'O', thirdOpponent: 'Y' };
  } else if (aiSymbol === 'O') {
    return { nextOpponent: 'Y', thirdOpponent: 'X' };
  } else {
    return { nextOpponent: 'X', thirdOpponent: 'O' };
  }
}

/**
 * Comprueba si un jugador puede ganar inmediatamente con alguna jugada.
 */
export function findWinningMoveThreePlayers(
  board: BoardModel,
  symbol: CellSymbol
): Vector4i | null {
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

/**
 * Cuenta cuántas amenazas de victoria (2 en raya con casilla libre) tiene un símbolo.
 */
function countWinningThreats(board: BoardModel, symbol: CellSymbol): number {
  let threats = 0;
  const validMoves = board.getValidMoves();
  for (const pos of validMoves) {
    board.makeMove(pos, symbol);
    const { winner } = board.checkWinner();
    board.undoMove(pos);
    if (winner === symbol) {
      threats++;
    }
  }
  return threats;
}

/**
 * Evalúa heurísticamente una jugada candidata para la IA de 3 jugadores.
 */
function scoreCandidateMove(
  board: BoardModel,
  pos: Vector4i,
  aiSymbol: CellSymbol,
  nextOpponent: CellSymbol,
  thirdOpponent: CellSymbol
): number {
  let score = 0;

  // 1. Victoria inmediata
  board.makeMove(pos, aiSymbol);
  const { winner } = board.checkWinner();
  if (winner === aiSymbol) {
    board.undoMove(pos);
    return 100000;
  }

  // 4. Crear bifurcaciones / doble amenaza (tenedores)
  const threats = countWinningThreats(board, aiSymbol);
  if (threats >= 2) {
    score += 1500;
  } else if (threats === 1) {
    score += 400;
  }
  board.undoMove(pos);

  // 2. Bloqueo urgente al siguiente jugador
  board.makeMove(pos, nextOpponent);
  const winNext = board.checkWinner().winner;
  board.undoMove(pos);
  if (winNext === nextOpponent) {
    score += 50000;
  }

  // 3. Bloqueo al tercer jugador
  board.makeMove(pos, thirdOpponent);
  const winThird = board.checkWinner().winner;
  board.undoMove(pos);
  if (winThird === thirdOpponent) {
    score += 30000;
  }

  // 5. Valor posicional en 3x3
  // Centro (1,1)
  if (pos.x === 1 && pos.y === 1) {
    score += 500;
  }
  // Esquinas
  else if ((pos.x === 0 || pos.x === 2) && (pos.y === 0 || pos.y === 2)) {
    score += 200;
  }
  // Laterales
  else {
    score += 100;
  }

  return score;
}

/**
 * Obtiene el mejor movimiento para la modalidad de 3 Jugadores.
 */
export function getBestMoveThreePlayers(
  board: BoardModel,
  aiSymbol: CellSymbol,
  difficulty: Difficulty = Difficulty.Hard
): Vector4i {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) {
    return { x: 0, y: 0, z: 0, w: 0 };
  }

  const { nextOpponent, thirdOpponent } = getOpponentsThreePlayers(aiSymbol);

  // Modo Fácil: 35% de probabilidad de movimiento aleatorio
  if (difficulty === Difficulty.Easy && Math.random() < 0.35) {
    const randIdx = Math.floor(Math.random() * validMoves.length);
    return validMoves[randIdx];
  }

  // Modo Medio: 15% de probabilidad de movimiento aleatorio
  if (difficulty === Difficulty.Medium && Math.random() < 0.15) {
    const randIdx = Math.floor(Math.random() * validMoves.length);
    return validMoves[randIdx];
  }

  // 1. Victoria inmediata garantizada
  const winMove = findWinningMoveThreePlayers(board, aiSymbol);
  if (winMove) {
    return winMove;
  }

  // 2. Bloqueo al siguiente jugador prioritario
  const blockNext = findWinningMoveThreePlayers(board, nextOpponent);
  if (blockNext) {
    return blockNext;
  }

  // 3. Bloqueo al tercer jugador
  const blockThird = findWinningMoveThreePlayers(board, thirdOpponent);
  if (blockThird) {
    return blockThird;
  }

  // 4. Evaluación heurística y ranking de mejores jugadas
  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const pos of validMoves) {
    const score = scoreCandidateMove(
      board,
      pos,
      aiSymbol,
      nextOpponent,
      thirdOpponent
    );

    // En caso de empate de puntuación, añadir ligero factor de ordenación
    if (score > bestScore) {
      bestScore = score;
      bestMove = pos;
    }
  }

  return bestMove;
}
