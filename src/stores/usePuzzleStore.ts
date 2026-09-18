import { create } from 'zustand';
import { BoardModel } from '../game/board/BoardModel';
import { Vector4i, areVectorsEqual, BoardType } from '../types/board';
import { PuzzleDef } from '../types/puzzle';
import { PUZZLE_CATALOG } from '../game/puzzles/PuzzleCatalog';
import { AudioService } from '../services/AudioService';
import { HapticService } from '../services/HapticService';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY_ORDER: PuzzleDifficulty[] = ['easy', 'medium', 'hard'];

interface PuzzleState {
  currentDifficulty: PuzzleDifficulty;
  roundPuzzles: PuzzleDef[];
  roundIndex: number;
  currentPuzzleIndex: number;
  currentPuzzle: PuzzleDef;
  board: BoardModel;
  isSolved: boolean;
  isFailed: boolean;
  feedbackMessage: string;
  completedPuzzleIds: string[];
  selectedPiece: Vector4i | null;
  failedInRound: PuzzleDef[];
  isRepeatingFailed: boolean;
  allCompleted: boolean;

  loadPuzzle: (index: number) => void;
  startDifficultyRound: (diff: PuzzleDifficulty) => void;
  playMove: (pos: Vector4i) => boolean;
  retryPuzzle: () => void;
  nextPuzzle: () => void;
}

function initBoardForPuzzle(puzzle: PuzzleDef): BoardModel {
  const obstacles =
    puzzle.obstacles ||
    (puzzle.boardType === BoardType.Obstacles4x4 ? BoardModel.DEFAULT_OBSTACLES : undefined);
  const board = new BoardModel(puzzle.boardType, undefined, obstacles);
  for (const move of puzzle.initialMoves) {
    board.makeMove(move.pos, move.symbol);
  }
  return board;
}

export const usePuzzleStore = create<PuzzleState>((set, get) => {
  const initialDifficulty: PuzzleDifficulty = 'easy';
  const initialRoundPuzzles = PUZZLE_CATALOG.filter((p) => p.difficulty === initialDifficulty);
  const initialPuzzle = initialRoundPuzzles[0] || PUZZLE_CATALOG[0];
  const initialBoard = initBoardForPuzzle(initialPuzzle);

  return {
    currentDifficulty: initialDifficulty,
    roundPuzzles: initialRoundPuzzles.length > 0 ? initialRoundPuzzles : PUZZLE_CATALOG,
    roundIndex: 0,
    currentPuzzleIndex: 0,
    currentPuzzle: initialPuzzle,
    board: initialBoard,
    isSolved: false,
    isFailed: false,
    feedbackMessage: '',
    completedPuzzleIds: [],
    selectedPiece: null,
    failedInRound: [],
    isRepeatingFailed: false,
    allCompleted: false,

    startDifficultyRound: (diff: PuzzleDifficulty) => {
      const diffPuzzles = PUZZLE_CATALOG.filter((p) => p.difficulty === diff);
      const puzzles = diffPuzzles.length > 0 ? diffPuzzles : PUZZLE_CATALOG;
      const firstPuzzle = puzzles[0];
      const globalIdx = PUZZLE_CATALOG.findIndex((p) => p.id === firstPuzzle.id);

      set({
        currentDifficulty: diff,
        roundPuzzles: puzzles,
        roundIndex: 0,
        currentPuzzleIndex: Math.max(0, globalIdx),
        currentPuzzle: firstPuzzle,
        board: initBoardForPuzzle(firstPuzzle),
        isSolved: false,
        isFailed: false,
        feedbackMessage: '',
        selectedPiece: null,
        failedInRound: [],
        isRepeatingFailed: false,
      });
    },

    loadPuzzle: (index: number) => {
      const safeIndex = Math.max(0, Math.min(index, PUZZLE_CATALOG.length - 1));
      const puzzle = PUZZLE_CATALOG[safeIndex];
      const newBoard = initBoardForPuzzle(puzzle);

      set({
        currentPuzzleIndex: safeIndex,
        currentPuzzle: puzzle,
        board: newBoard,
        isSolved: false,
        isFailed: false,
        feedbackMessage: '',
        selectedPiece: null,
      });
    },

    playMove: (pos: Vector4i): boolean => {
      const state = get();
      if (state.isSolved || state.isFailed) return false;

      const { currentPuzzle, board, selectedPiece } = state;

      // Soporte para modo movimiento en puzzles
      if (board.isMovement() && board.isMovementPhase()) {
        const cellContent = board.getCell(pos);
        if (cellContent === currentPuzzle.playerSymbol) {
          if (selectedPiece && areVectorsEqual(selectedPiece, pos)) {
            set({ selectedPiece: null });
          } else {
            set({ selectedPiece: pos });
            HapticService.selection();
          }
          return true;
        }

        if (selectedPiece && cellContent === ' ' && board.isAdjacent(selectedPiece, pos)) {
          const isCorrect = areVectorsEqual(pos, currentPuzzle.targetMove);
          board.movePiece(selectedPiece, pos, currentPuzzle.playerSymbol);

          if (isCorrect) {
            AudioService.playWin();
            HapticService.success();
            const updatedCompleted = state.completedPuzzleIds.includes(currentPuzzle.id)
              ? state.completedPuzzleIds
              : [...state.completedPuzzleIds, currentPuzzle.id];

            set({
              board: board.clone(),
              isSolved: true,
              isFailed: false,
              feedbackMessage: `¡Excelente! ${currentPuzzle.explanation}`,
              completedPuzzleIds: updatedCompleted,
              selectedPiece: null,
            });
            return true;
          } else {
            AudioService.playMoveX();
            HapticService.warning();
            const existsInFailed = state.failedInRound.some((p) => p.id === currentPuzzle.id);
            const updatedFailed = existsInFailed
              ? state.failedInRound
              : [...state.failedInRound, currentPuzzle];

            set({
              board: board.clone(),
              isSolved: false,
              isFailed: true,
              feedbackMessage: '¡Jugada incorrecta! El desafío se repetirá al final de la ronda.',
              failedInRound: updatedFailed,
              selectedPiece: null,
            });
            return false;
          }
        }

        HapticService.warning();
        return false;
      }

      // Jugada de colocación estándar
      if (!board.isCellEmpty(pos)) {
        HapticService.warning();
        return false;
      }

      const isCorrect = areVectorsEqual(pos, currentPuzzle.targetMove);
      board.makeMove(pos, currentPuzzle.playerSymbol);

      if (isCorrect) {
        AudioService.playWin();
        HapticService.success();
        const updatedCompleted = state.completedPuzzleIds.includes(currentPuzzle.id)
          ? state.completedPuzzleIds
          : [...state.completedPuzzleIds, currentPuzzle.id];

        set({
          board: board.clone(),
          isSolved: true,
          isFailed: false,
          feedbackMessage: `¡Excelente! ${currentPuzzle.explanation}`,
          completedPuzzleIds: updatedCompleted,
          selectedPiece: null,
        });
        return true;
      } else {
        AudioService.playMoveX();
        HapticService.warning();
        const existsInFailed = state.failedInRound.some((p) => p.id === currentPuzzle.id);
        const updatedFailed = existsInFailed
          ? state.failedInRound
          : [...state.failedInRound, currentPuzzle];

        set({
          board: board.clone(),
          isSolved: false,
          isFailed: true,
          feedbackMessage: '¡Jugada incorrecta! El desafío se repetirá al final de la ronda.',
          failedInRound: updatedFailed,
          selectedPiece: null,
        });
        return false;
      }
    },

    retryPuzzle: () => {
      const state = get();
      const newBoard = initBoardForPuzzle(state.currentPuzzle);
      set({
        board: newBoard,
        isSolved: false,
        isFailed: false,
        feedbackMessage: '',
        selectedPiece: null,
      });
    },

    nextPuzzle: () => {
      const state = get();

      // 1. Si aún quedan puzzles en la lista de la ronda actual
      if (state.roundIndex + 1 < state.roundPuzzles.length) {
        const nextIdx = state.roundIndex + 1;
        const nextPuzzle = state.roundPuzzles[nextIdx];
        const newBoard = initBoardForPuzzle(nextPuzzle);
        const globalIdx = PUZZLE_CATALOG.findIndex((p) => p.id === nextPuzzle.id);

        set({
          roundIndex: nextIdx,
          currentPuzzleIndex: Math.max(0, globalIdx),
          currentPuzzle: nextPuzzle,
          board: newBoard,
          isSolved: false,
          isFailed: false,
          feedbackMessage: '',
          selectedPiece: null,
        });
        return;
      }

      // 2. Fin de la lista de la ronda actual: ¿Quedan puzzles que se fallaron?
      if (state.failedInRound.length > 0) {
        const repeatedPuzzles = [...state.failedInRound];
        const firstPuz = repeatedPuzzles[0];
        const newBoard = initBoardForPuzzle(firstPuz);
        const globalIdx = PUZZLE_CATALOG.findIndex((p) => p.id === firstPuz.id);

        set({
          roundPuzzles: repeatedPuzzles,
          failedInRound: [],
          roundIndex: 0,
          isRepeatingFailed: true,
          currentPuzzleIndex: Math.max(0, globalIdx),
          currentPuzzle: firstPuz,
          board: newBoard,
          isSolved: false,
          isFailed: false,
          feedbackMessage: 'Repitiendo los desafíos fallidos de esta ronda...',
          selectedPiece: null,
        });
        return;
      }

      // 3. No hay puzzles fallidos pendientes: avanzar al siguiente nivel de dificultad
      const currentDiffIdx = DIFFICULTY_ORDER.indexOf(state.currentDifficulty);
      if (currentDiffIdx < DIFFICULTY_ORDER.length - 1) {
        const nextDiff = DIFFICULTY_ORDER[currentDiffIdx + 1];
        const nextDiffPuzzles = PUZZLE_CATALOG.filter((p) => p.difficulty === nextDiff);

        if (nextDiffPuzzles.length > 0) {
          const firstPuz = nextDiffPuzzles[0];
          const newBoard = initBoardForPuzzle(firstPuz);
          const globalIdx = PUZZLE_CATALOG.findIndex((p) => p.id === firstPuz.id);

          set({
            currentDifficulty: nextDiff,
            roundPuzzles: nextDiffPuzzles,
            roundIndex: 0,
            failedInRound: [],
            isRepeatingFailed: false,
            currentPuzzleIndex: Math.max(0, globalIdx),
            currentPuzzle: firstPuz,
            board: newBoard,
            isSolved: false,
            isFailed: false,
            feedbackMessage: `¡Ronda superada! Iniciando desafíos en dificultad ${nextDiff.toUpperCase()}...`,
            selectedPiece: null,
          });
          return;
        }
      }

      // 4. ¡Todos los niveles y dificultades completados!
      set({
        allCompleted: true,
        feedbackMessage: '🏆 ¡Has completado todos los desafíos tácticos del juego!',
      });
    },
  };
});
