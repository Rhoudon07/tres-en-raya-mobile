import { BoardModel } from '../board/BoardModel';
import { BoardType, CellSymbol, Vector4i, MovementMove } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getBestMove3x3 } from './Minimax3x3';
import { getBestMove4x4 } from './Minimax4x4';
import { getBestMoveGravity4x4 } from './MinimaxGravity';
import { getBestMove3D } from './Minimax3D';
import { getBestMove4D } from './Minimax4D';
import { getBestMove4x4_3D } from './Minimax4x4_3D';
import { getBestMove5x5 } from './Minimax5x5';
import { getBestMoveUltimate } from './MinimaxUltimate';
import { getBestMoveLimited } from './MinimaxLimited';
import { getBestMoveMisere } from './MinimaxMisere';
import { getBestPlacementMove, getBestPieceMove } from './MinimaxMovement';
import { getBestMoveObstacles } from './MinimaxObstacles';
import { getBestMoveThreePlayers } from './MinimaxThreePlayers';
import { getBestMovePowers } from './MinimaxPowers';

export class AIEngine {
  /**
   * Obtiene el mejor movimiento de forma síncrona.
   */
  public static getBestMoveSync(
    board: BoardModel,
    aiSymbol: CellSymbol,
    humanSymbol: CellSymbol,
    difficulty: Difficulty = Difficulty.Hard
  ): Vector4i {
    switch (board.type) {
      case BoardType.TicTacToe3x3:
      case BoardType.TimeAttack3x3:
        return getBestMove3x3(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Movement3x3:
        if (!board.isMovementPhase()) {
          return getBestPlacementMove(board, aiSymbol, humanSymbol, difficulty);
        }
        return getBestPieceMove(board, aiSymbol, humanSymbol, difficulty).to;
      case BoardType.Connect4x4:
        return getBestMove4x4(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Connect5x5:
        return getBestMove5x5(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Gravity4x4:
        return getBestMoveGravity4x4(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.TicTacToe3D:
        return getBestMove3D(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.TicTacToe4D:
        return getBestMove4D(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.TicTacToe4x4_3D:
        return getBestMove4x4_3D(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Ultimate:
        return getBestMoveUltimate(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Limited3x3:
        return getBestMoveLimited(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Misere3x3:
        return getBestMoveMisere(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.Obstacles4x4:
        return getBestMoveObstacles(board, aiSymbol, humanSymbol, difficulty);
      case BoardType.ThreePlayers3x3:
      case BoardType.ThreePlayers5x5:
        return getBestMoveThreePlayers(board, aiSymbol, difficulty);
      case BoardType.Powers3x3:
        return getBestMovePowers(board, aiSymbol, humanSymbol, difficulty);
      default:
        return { x: 0, y: 0, z: 0, w: 0 };
    }
  }

  /**
   * Obtiene el mejor desplazamiento de pieza (from -> to) para la fase de movimiento.
   */
  public static getBestPieceMoveSync(
    board: BoardModel,
    aiSymbol: CellSymbol,
    humanSymbol: CellSymbol,
    difficulty: Difficulty = Difficulty.Hard
  ): MovementMove {
    return getBestPieceMove(board, aiSymbol, humanSymbol, difficulty);
  }

  /**
   * Ejecuta el cálculo de desplazamiento de pieza de forma asíncrona.
   */
  public static async getBestPieceMoveAsync(
    board: BoardModel,
    aiSymbol: CellSymbol,
    humanSymbol: CellSymbol,
    difficulty: Difficulty = Difficulty.Hard,
    simulatedDelayMs: number = 450
  ): Promise<MovementMove> {
    const start = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10));

    const bestMove = this.getBestPieceMoveSync(board, aiSymbol, humanSymbol, difficulty);

    const elapsed = Date.now() - start;
    if (elapsed < simulatedDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs - elapsed));
    }

    return bestMove;
  }

  /**
   * Ejecuta el cálculo de IA de forma asíncrona permitiendo que la UI
   * muestre la animación de "Pensando..." sin congelar la pantalla.
   */
  public static async getBestMoveAsync(
    board: BoardModel,
    aiSymbol: CellSymbol,
    humanSymbol: CellSymbol,
    difficulty: Difficulty = Difficulty.Hard,
    simulatedDelayMs: number = 450
  ): Promise<Vector4i> {
    const start = Date.now();

    // Yield al event loop de JavaScript
    await new Promise((resolve) => setTimeout(resolve, 10));

    const bestMove = this.getBestMoveSync(board, aiSymbol, humanSymbol, difficulty);

    const elapsed = Date.now() - start;
    if (elapsed < simulatedDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs - elapsed));
    }

    return bestMove;
  }
}
