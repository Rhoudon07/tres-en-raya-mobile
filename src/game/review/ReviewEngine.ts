import { BoardModel } from '../board/BoardModel';
import { BoardType, CellSymbol, Vector4i, areVectorsEqual } from '../../types/board';
import { getWinningLines } from '../board/WinningLines';
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

function findImmediateThreat(board: BoardModel, symbol: CellSymbol): Vector4i | null {
  const lines = getWinningLines(board.type);
  for (let l = 0; l < lines.length; ++l) {
    const line = lines[l];
    let countSym = 0;
    let emptyPos: Vector4i | null = null;
    let blocked = false;

    for (let i = 0; i < line.length; ++i) {
      const c = board.getCell(line[i]);
      if (c === symbol) {
        countSym++;
      } else if (c === ' ') {
        if (emptyPos === null) {
          emptyPos = line[i];
        } else {
          // Más de un espacio libre, no es amenaza inmediata en esta jugada
          blocked = true;
          break;
        }
      } else {
        // Celda ocupada por el adversario
        blocked = true;
        break;
      }
    }

    if (!blocked && countSym === line.length - 1 && emptyPos !== null) {
      return emptyPos;
    }
  }
  return null;
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

      let ma: MoveAnalysis;

      // 1. ¿La jugada realizada fue una victoria inmediata?
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
        // 2. ¿El jugador omitió una victoria inmediata servida?
        const myWinThreat = findImmediateThreat(simBoard, curSym);

        if (myWinThreat) {
          ma = {
            quality: MoveQuality.Blunder,
            badgeText: 'PIFIA GRAVE',
            badgeColor: Colors.reviewBlunder,
            commentary: `Pifia: Se omitió una victoria inmediata en ${formatCoord(type, myWinThreat)}.`,
            tip: '✦ Sugerencia ganadora resaltada en verde esmeralda en el tablero.',
            suggestedMove: myWinThreat,
            accuracy: 0,
          };
        } else {
          // 3. ¿El rival tenía una amenaza de victoria inmediata?
          const oppThreat = findImmediateThreat(simBoard, oppSym);

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
          } else {
            // 4. No hay victoria ni amenaza inmediata: evaluar posición óptima con el motor
            const bestPos = AIEngine.getBestMoveSync(simBoard, curSym, oppSym, Difficulty.Hard);

            if (areVectorsEqual(actualPos, bestPos)) {
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
              // 5. Verificar si la jugada actual concede victoria inmediata al rival
              simBoard.makeMove(actualPos, curSym);
              const concededWin = findImmediateThreat(simBoard, oppSym);
              simBoard.undoMove(actualPos);

              if (concededWin) {
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
