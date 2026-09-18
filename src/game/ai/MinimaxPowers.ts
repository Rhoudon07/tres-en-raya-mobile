import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { PowerType, PlayerPowers } from '../../types/powers';
import { getBestMove3x3 } from './Minimax3x3';

export interface PowerMoveDecision {
  move: Vector4i;
  powerToUse?: PowerType;
  powerTarget?: Vector4i;
  powerTargetB?: Vector4i;
}

/**
 * Busca si un jugador puede ganar inmediatamente en 1 jugada regular.
 */
function findWinningMove(board: BoardModel, symbol: CellSymbol): Vector4i | null {
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
 * Motor de IA para la modalidad de Poderes y Habilidades Tácticas en 3x3.
 */
export function getBestDecisionPowers(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  powers: PlayerPowers,
  difficulty: Difficulty = Difficulty.Hard
): PowerMoveDecision {
  const validMoves = board.getValidMoves();
  if (validMoves.length === 0) {
    return { move: { x: 0, y: 0, z: 0, w: 0 } };
  }

  // 1. ¿Puede la IA ganar inmediatamente con un movimiento normal?
  const immediateWin = findWinningMove(board, aiSymbol);
  if (immediateWin) {
    return { move: immediateWin };
  }

  // 2. ¿Tiene el oponente una jugada ganadora inminente?
  const opponentWin = findWinningMove(board, humanSymbol);

  if (opponentWin) {
    // Si la dificultad es media o difícil, defender con prioridad
    if (difficulty !== Difficulty.Easy) {
      // 2.1 ¿Podemos bloquear directamente jugando en esa casilla?
      return { move: opponentWin };
    }
  }

  // 3. ¿Podemos activar Doble Turno para ganar de forma fulminante?
  if (!powers.doubleTurnUsed && difficulty === Difficulty.Hard && validMoves.length >= 2) {
    for (let i = 0; i < validMoves.length; ++i) {
      const posA = validMoves[i];
      board.makeMove(posA, aiSymbol);

      const secondWin = findWinningMove(board, aiSymbol);
      board.undoMove(posA);

      if (secondWin) {
        return {
          move: posA,
          powerToUse: PowerType.DoubleTurn,
        };
      }
    }
  }

  // 4. ¿Podemos usar Bloqueo Territorial para anular una casilla clave?
  if (!powers.blockCellUsed && opponentWin && difficulty === Difficulty.Hard) {
    // Si bloquear la casilla deja al rival sin opciones
    return {
      move: opponentWin,
      powerToUse: PowerType.BlockCell,
      powerTarget: opponentWin,
    };
  }

  // 5. Jugada estándar evaluada con Minimax 3x3
  const standardMove = getBestMove3x3(board, aiSymbol, humanSymbol, difficulty);
  return { move: standardMove };
}

/**
 * Función compatible para AIEngine que retorna el Vector4i correspondiente.
 */
export function getBestMovePowers(
  board: BoardModel,
  aiSymbol: CellSymbol,
  humanSymbol: CellSymbol,
  difficulty: Difficulty = Difficulty.Hard
): Vector4i {
  // Cuando se invoca desde la interfaz estándar sin inventario explícito
  const dummyPowers: PlayerPowers = {
    bombUsed: true,
    doubleTurnUsed: true,
    blockCellUsed: true,
    swapUsed: true,
  };
  return getBestDecisionPowers(board, aiSymbol, humanSymbol, dummyPowers, difficulty).move;
}
