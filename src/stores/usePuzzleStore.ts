import { create } from 'zustand';
import { BoardModel } from '../game/board/BoardModel';
import { Vector4i, areVectorsEqual } from '../types/board';
import { PuzzleDef } from '../types/puzzle';
import { PUZZLE_CATALOG } from '../game/puzzles/PuzzleCatalog';
import { AudioService } from '../services/AudioService';
import { HapticService } from '../services/HapticService';

interface PuzzleState {
  currentPuzzleIndex: number;
  currentPuzzle: PuzzleDef;
  board: BoardModel;
  isSolved: boolean;
  isFailed: boolean;
  feedbackMessage: string;
  completedPuzzleIds: string[];
  selectedPiece: Vector4i | null;

  loadPuzzle: (index: number) => void;
  playMove: (pos: Vector4i) => boolean;
  retryPuzzle: () => void;
  nextPuzzle: () => void;
}

function initBoardForPuzzle(puzzle: PuzzleDef): BoardModel {
  const board = new BoardModel(puzzle.boardType);
  for (const move of puzzle.initialMoves) {
    board.makeMove(move.pos, move.symbol);
  }
  return board;
}

export const usePuzzleStore = create<PuzzleState>((set, get) => {
  const initialPuzzle = PUZZLE_CATALOG[0];
  const initialBoard = initBoardForPuzzle(initialPuzzle);

  return {
    currentPuzzleIndex: 0,
    currentPuzzle: initialPuzzle,
    board: initialBoard,
    isSolved: false,
    isFailed: false,
    feedbackMessage: '',
    completedPuzzleIds: [],
    selectedPiece: null,

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
      if (state.isSolved) return false;

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
          // Evaluar si es el movimiento objetivo
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
            set({
              board: board.clone(),
              isSolved: false,
              isFailed: true,
              feedbackMessage: 'Esa jugada no resuelve el puzzle. ¡Inténtalo de nuevo!',
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
        set({
          board: board.clone(),
          isSolved: false,
          isFailed: true,
          feedbackMessage: 'Esa jugada no resuelve el puzzle. ¡Inténtalo de nuevo!',
          selectedPiece: null,
        });
        return false;
      }
    },

    retryPuzzle: () => {
      const state = get();
      state.loadPuzzle(state.currentPuzzleIndex);
    },

    nextPuzzle: () => {
      const state = get();
      if (state.currentPuzzleIndex < PUZZLE_CATALOG.length - 1) {
        state.loadPuzzle(state.currentPuzzleIndex + 1);
      }
    },
  };
});
