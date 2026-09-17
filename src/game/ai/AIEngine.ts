import { BoardModel } from '../board/BoardModel';
import { BoardType, CellSymbol, Vector4i } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { getBestMove3x3 } from './Minimax3x3';
import { getBestMove4x4 } from './Minimax4x4';
import { getBestMoveGravity4x4 } from './MinimaxGravity';
import { getBestMove3D } from './Minimax3D';
import { getBestMove4D } from './Minimax4D';
import { getBestMove4x4_3D } from './Minimax4x4_3D';
import { getBestMove5x5 } from './Minimax5x5';

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
        return getBestMove3x3(board, aiSymbol, humanSymbol, difficulty);
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
      default:
        return { x: 0, y: 0, z: 0, w: 0 };
    }
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
