import { BoardModel } from '../board/BoardModel';
import { BoardType, Vector4i, areVectorsEqual } from '../../types/board';
import { Difficulty } from '../../types/ai';
import { GameReviewReport, MoveAnalysis, MoveQuality, MoveRecord } from '../../types/review';
import { AIEngine } from '../ai/AIEngine';
import { Colors } from '../../constants/colors';

export function formatCoord(type: BoardType, pos: Vector4i): string {
  if (type === BoardType.TicTacToe3D || type === BoardType.TicTacToe4x4_3D) {
    return `Piso ${pos.z + 1} (Fila ${pos.x + 1}, Col ${pos.y + 1})`;
  } else if (type === BoardType.TicTacToe4D) {
    return `Cubo (${pos.w + 1},${pos.z + 1}) [${pos.x + 1},${pos.y + 1}]`;
  } else {
    return `Fila ${pos.x + 1}, Col ${pos.y + 1}`;
  }
}

export class ReviewEngine {
  public static analyzeGame(type: BoardType, moveHistory: MoveRecord[]): GameReviewReport {
    if (moveHistory.length === 0) {
      return {
        analyses: [],
        accuracyX: 100,
        accuracyO: 100,
        moveHistory: [],
      };
    }

    const analyses: MoveAnalysis[] = [];
    const simBoard = new BoardModel(type);

    let totalAccX = 0;
    let countX = 0;
    let totalAccO = 0;
    let countO = 0;

    for (let i = 0; i < moveHistory.length; ++i) {
      const rec = moveHistory[i];
      if (!rec || !rec.pos || !rec.symbol) continue;
      const curSym = rec.symbol;
      const oppSym = curSym === 'X' ? 'O' : 'X';
      const actualPos = rec.pos;

      // 1. Obtener mejor movimiento según el motor en Hard
      const bestPos = AIEngine.getBestMoveSync(simBoard, curSym, oppSym, Difficulty.Hard);

      let ma: MoveAnalysis;

      // 2. Verificar si la jugada realizada fue victoria inmediata
      simBoard.makeMove(actualPos, curSym);
      const { winner: actualWinner } = simBoard.checkWinner();
      simBoard.undoMove(actualPos);
      const actualWon = actualWinner === curSym;

      if (actualWon) {
        ma = {
          quality: MoveQuality.Best,
          badgeText: 'MEJOR JUGADA',
          badgeColor: Colors.reviewBest,
          commentary: '¡Victoria! Completaste la línea ganadora con precisión.',
          tip: '✦ Movimiento definitivo que sella la partida con éxito.',
          suggestedMove: { x: -1, y: -1, z: -1, w: -1 },
          accuracy: 100,
        };
      } else {
        // 3. Verificar si omitió victoria inmediata que sí lograba bestPos
        simBoard.makeMove(bestPos, curSym);
        const { winner: bestWinner } = simBoard.checkWinner();
        simBoard.undoMove(bestPos);
        const bestWon = bestWinner === curSym;

        if (bestWon) {
          ma = {
            quality: MoveQuality.Blunder,
            badgeText: 'PIFIA GRAVE',
            badgeColor: Colors.reviewBlunder,
            commentary: `Pifia: Se omitió una victoria inmediata en ${formatCoord(type, bestPos)}.`,
            tip: '✦ Sugerencia ganadora resaltada en verde esmeralda en el tablero.',
            suggestedMove: bestPos,
            accuracy: 0,
          };
        } else {
          // 4. Verificar si el rival tenía una amenaza de victoria inmediata
          let oppThreat: Vector4i | null = null;
          const lines = simBoard.is4D()
            ? 3
            : simBoard.is3D()
            ? 3
            : simBoard.gridSize;

          const maxW = simBoard.is4D() ? 3 : 1;
          const maxZ =
            simBoard.type === BoardType.TicTacToe4x4_3D
              ? 4
              : simBoard.is3D() || simBoard.is4D()
              ? 3
              : 1;

          outerLoop: for (let w = 0; w < maxW; ++w) {
            for (let z = 0; z < maxZ; ++z) {
              for (let x = 0; x < simBoard.gridSize; ++x) {
                for (let y = 0; y < simBoard.gridSize; ++y) {
                  const checkPos: Vector4i = { x, y, z, w };
                  if (simBoard.isCellEmpty(checkPos)) {
                    simBoard.makeMove(checkPos, oppSym);
                    const { winner: oppWin } = simBoard.checkWinner();
                    simBoard.undoMove(checkPos);

                    if (oppWin === oppSym) {
                      oppThreat = checkPos;
                      break outerLoop;
                    }
                  }
                }
              }
            }
          }

          if (oppThreat) {
            if (areVectorsEqual(actualPos, oppThreat)) {
              ma = {
                quality: MoveQuality.Best,
                badgeText: 'MEJOR JUGADA',
                badgeColor: Colors.reviewBest,
                commentary: '¡Excelente defensa! Bloqueaste la amenaza de victoria rival.',
                tip: '✦ Bloqueo necesario para evitar la derrota inmediata.',
                suggestedMove: { x: -1, y: -1, z: -1, w: -1 },
                accuracy: 100,
              };
            } else {
              ma = {
                quality: MoveQuality.Blunder,
                badgeText: 'PIFIA GRAVE',
                badgeColor: Colors.reviewBlunder,
                commentary: `Pifia: No bloqueaste la victoria del rival en ${formatCoord(type, oppThreat)}.`,
                tip: '✦ Bloqueo defensivo crucial sugerido en verde esmeralda.',
                suggestedMove: oppThreat,
                accuracy: 0,
              };
            }
          } else if (areVectorsEqual(actualPos, bestPos)) {
            ma = {
              quality: MoveQuality.Best,
              badgeText: 'MEJOR JUGADA',
              badgeColor: Colors.reviewBest,
              commentary: 'Movimiento óptimo encontrado por el motor Minimax.',
              tip: '✦ Mantiene el máximo control estratégico de la posición.',
              suggestedMove: { x: -1, y: -1, z: -1, w: -1 },
              accuracy: 100,
            };
          } else {
            // 5. Verificar si jugar actualPos concede victoria inmediata al rival
            simBoard.makeMove(actualPos, curSym);
            let createsLoss = false;

            lossCheck: for (let w = 0; w < maxW; ++w) {
              for (let z = 0; z < maxZ; ++z) {
                for (let x = 0; x < simBoard.gridSize; ++x) {
                  for (let y = 0; y < simBoard.gridSize; ++y) {
                    const testPos: Vector4i = { x, y, z, w };
                    if (simBoard.isCellEmpty(testPos)) {
                      simBoard.makeMove(testPos, oppSym);
                      const { winner: testWin } = simBoard.checkWinner();
                      simBoard.undoMove(testPos);

                      if (testWin === oppSym) {
                        createsLoss = true;
                        break lossCheck;
                      }
                    }
                  }
                }
              }
            }
            simBoard.undoMove(actualPos);

            if (createsLoss) {
              ma = {
                quality: MoveQuality.Mistake,
                badgeText: 'ERROR TÁCTICO',
                badgeColor: Colors.reviewMistake,
                commentary: 'Error: Esta casilla permite al rival responder con victoria.',
                tip: `✦ Era mejor jugar en ${formatCoord(type, bestPos)} (sugerida en verde).`,
                suggestedMove: bestPos,
                accuracy: 25,
              };
            } else {
              ma = {
                quality: MoveQuality.Good,
                badgeText: 'BUENA JUGADA',
                badgeColor: Colors.reviewGood,
                commentary: 'Buena jugada: Mantiene la posición equilibrada y segura.',
                tip: `✦ El motor sugería ${formatCoord(type, bestPos)} para mayor iniciativa.`,
                suggestedMove: bestPos,
                accuracy: 80,
              };
            }
          }
        }
      }

      if (curSym === 'X') {
        totalAccX += ma.accuracy;
        countX++;
      } else {
        totalAccO += ma.accuracy;
        countO++;
      }

      analyses.push(ma);

      // Avanzar el tablero de simulación con el movimiento real
      simBoard.makeMove(actualPos, curSym);
    }

    const accuracyX = countX > 0 ? parseFloat((totalAccX / countX).toFixed(1)) : 100;
    const accuracyO = countO > 0 ? parseFloat((totalAccO / countO).toFixed(1)) : 100;

    return {
      analyses,
      accuracyX,
      accuracyO,
      moveHistory,
    };
  }
}
