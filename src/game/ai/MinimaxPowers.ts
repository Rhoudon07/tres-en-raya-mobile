import { BoardModel } from '../board/BoardModel';
import { CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { PowerType, PlayerPowers } from '../../types/powers';
import { getBestMove3x3 } from './Minimax3x3';
import { getBestMove5x5 } from './Minimax5x5';

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
 * Encuentra todas las jugadas donde un jugador gana inmediatamente.
 * Si hay 2 o más, el jugador tiene una horquilla (fork) activa.
 */
function findAllWinningMoves(board: BoardModel, symbol: CellSymbol): Vector4i[] {
  const winningMoves: Vector4i[] = [];
  const validMoves = board.getValidMoves();
  for (const pos of validMoves) {
    board.makeMove(pos, symbol);
    const { winner } = board.checkWinner();
    board.undoMove(pos);
    if (winner === symbol) {
      winningMoves.push(pos);
    }
  }
  return winningMoves;
}

/**
 * Motor de IA para la modalidad de Poderes y Habilidades Tácticas en 3x3.
 * Toma decisiones tácticas empleando las 4 habilidades (Bomba, Doble Turno, Bloqueo y Swap)
 * respetando el límite estricto de 1 habilidad por partida.
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

  // Comprobar si la IA ya utilizó su única habilidad en la partida
  const canUsePower = !powers.hasUsedPower && powers.usedPower === null;

  // 1. ¿Puede la IA ganar inmediatamente con un movimiento normal sin gastar habilidad?
  const immediateWin = findWinningMove(board, aiSymbol);
  if (immediateWin) {
    return { move: immediateWin };
  }

  // Si ya no le quedan habilidades a la CPU, jugar Minimax estándar según el tamaño del tablero
  if (!canUsePower) {
    const fallback = board.gridSize === 5
      ? getBestMove5x5(board, aiSymbol, humanSymbol, difficulty)
      : getBestMove3x3(board, aiSymbol, humanSymbol, difficulty);
    return { move: fallback };
  }

  const aiPieces = board.getPieces(aiSymbol);
  const humanPieces = board.getPieces(humanSymbol);

  // 2. ¿Podemos ganar inmediatamente con Swap (Intercambio Cuántico)?
  if (difficulty !== Difficulty.Easy && aiPieces.length > 0 && humanPieces.length > 0) {
    for (const pAi of aiPieces) {
      for (const pHuman of humanPieces) {
        if (board.swapCells(pAi, pHuman)) {
          const { winner } = board.checkWinner();
          board.undoPower();
          if (winner === aiSymbol) {
            return {
              powerToUse: PowerType.Swap,
              powerTarget: pAi,
              powerTargetB: pHuman,
              move: pAi,
            };
          }
        }
      }
    }
  }

  // 3. ¿Podemos activar Doble Turno para ganar en 2 colocaciones consecutivas?
  if (difficulty !== Difficulty.Easy && validMoves.length >= 2) {
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

  // 4. Evaluar amenazas del rival
  const humanWins = findAllWinningMoves(board, humanSymbol);

  // 4.1 Horquilla rival (2 o más amenazas simultáneas): un movimiento normal no basta
  if (humanWins.length >= 2 && difficulty === Difficulty.Hard) {
    let bestBombTarget: Vector4i | null = null;
    let minWinsAfterBomb = humanWins.length;

    // Probar Bomba para eliminar la ficha rival que más desactive la horquilla
    for (const pHuman of humanPieces) {
      if (board.clearCell(pHuman)) {
        const remainingWins = findAllWinningMoves(board, humanSymbol);
        board.undoPower();
        if (remainingWins.length < minWinsAfterBomb) {
          minWinsAfterBomb = remainingWins.length;
          bestBombTarget = pHuman;
        }
      }
    }

    if (bestBombTarget && minWinsAfterBomb < humanWins.length) {
      return {
        powerToUse: PowerType.Bomb,
        powerTarget: bestBombTarget,
        move: bestBombTarget,
      };
    }

    // Probar Swap para romper la horquilla rival
    for (const pAi of aiPieces) {
      for (const pHuman of humanPieces) {
        if (board.swapCells(pAi, pHuman)) {
          const remainingWins = findAllWinningMoves(board, humanSymbol);
          board.undoPower();
          if (remainingWins.length < humanWins.length) {
            return {
              powerToUse: PowerType.Swap,
              powerTarget: pAi,
              powerTargetB: pHuman,
              move: pAi,
            };
          }
        }
      }
    }
  }

  // 4.2 Amenaza única del rival: bloquearla normalmente para conservar la habilidad
  if (humanWins.length === 1 && difficulty !== Difficulty.Easy) {
    return { move: humanWins[0] };
  }

  // 5. Estrategia ofensiva con habilidades tácticas (Dificultad Media y Difícil)
  if (difficulty === Difficulty.Hard || (difficulty === Difficulty.Medium && Math.random() < 0.6)) {
    // 5.1 Doble Turno para crear una horquilla imparable
    if (validMoves.length >= 3) {
      for (let i = 0; i < validMoves.length; ++i) {
        const m1 = validMoves[i];
        board.makeMove(m1, aiSymbol);
        const remainingMoves = board.getValidMoves();

        for (let j = 0; j < remainingMoves.length; ++j) {
          const m2 = remainingMoves[j];
          board.makeMove(m2, aiSymbol);

          const futureWins = findAllWinningMoves(board, aiSymbol);
          board.undoMove(m2);

          if (futureWins.length >= 2) {
            board.undoMove(m1);
            return {
              move: m1,
              powerToUse: PowerType.DoubleTurn,
            };
          }
        }
        board.undoMove(m1);
      }
    }

    // 5.2 Bomba sobre el centro si el rival lo domina y tiene ventaja de fichas
    const centerCoord = Math.floor(board.gridSize / 2);
    const centerPos: Vector4i = { x: centerCoord, y: centerCoord, z: 0, w: 0 };
    if (
      board.getCell(centerPos) === humanSymbol &&
      humanPieces.length >= 2 &&
      aiPieces.length <= humanPieces.length
    ) {
      return {
        powerToUse: PowerType.Bomb,
        powerTarget: centerPos,
        move: centerPos,
      };
    }

    // 5.3 Bloqueo territorial de casilla central si está vacía y el rival domina esquinas
    if (board.isCellEmpty(centerPos) && humanPieces.length >= 2) {
      return {
        powerToUse: PowerType.BlockCell,
        powerTarget: centerPos,
        move: centerPos,
      };
    }
  }

  // 6. Jugada estándar evaluada con Minimax según el tamaño del tablero
  const standardMove = board.gridSize === 5
    ? getBestMove5x5(board, aiSymbol, humanSymbol, difficulty)
    : getBestMove3x3(board, aiSymbol, humanSymbol, difficulty);
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
  const dummyPowers: PlayerPowers = {
    bombUsed: true,
    doubleTurnUsed: true,
    blockCellUsed: true,
    swapUsed: true,
    hasUsedPower: true,
    usedPower: PowerType.Bomb,
  };
  return getBestDecisionPowers(board, aiSymbol, humanSymbol, dummyPowers, difficulty).move;
}
