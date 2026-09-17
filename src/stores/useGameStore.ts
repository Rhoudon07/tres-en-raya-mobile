import { create } from 'zustand';
import { BoardModel } from '../game/board/BoardModel';
import { BoardType, CellSymbol, Vector4i, areVectorsEqual } from '../types/board';
import { GameMode, PlayerTurnOrder, Score } from '../types/game';
import { MoveRecord, GameReviewReport } from '../types/review';
import { AIEngine } from '../game/ai/AIEngine';
import { useSettingsStore } from './useSettingsStore';
import { useStatsStore } from './useStatsStore';
import { AudioService } from '../services/AudioService';
import { HapticService } from '../services/HapticService';
import { ReviewEngine } from '../game/review/ReviewEngine';

interface GameStoreState {
  boardType: BoardType;
  board: BoardModel;
  mode: GameMode;
  turnOrder: PlayerTurnOrder;
  currentTurn: CellSymbol;
  score: Score;
  isCpuThinking: boolean;
  gameOver: boolean;
  resultMessage: string;
  winningLine: Vector4i[] | null;
  moveHistory: MoveRecord[];
  reviewReport: GameReviewReport | null;

  // Propiedad para selección de ficha en modalidad Movimiento
  selectedPiece: Vector4i | null;

  // Acciones
  setBoardType: (type: BoardType) => void;
  startNewGame: (mode: GameMode, order?: PlayerTurnOrder) => void;
  restartCurrentGame: () => void;
  selectPiece: (pos: Vector4i | null) => void;
  playMove: (pos: Vector4i) => Promise<boolean>;
  playPieceMove: (from: Vector4i, to: Vector4i) => Promise<boolean>;
  handleTimeout: (timedOutPlayer: CellSymbol) => void;
  executeCpuTurnIfNeeded: () => Promise<void>;
  generateReviewReport: () => GameReviewReport;
  resetScore: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  boardType: BoardType.TicTacToe3x3,
  board: new BoardModel(BoardType.TicTacToe3x3),
  mode: GameMode.PvCPU,
  turnOrder: PlayerTurnOrder.First,
  currentTurn: 'X',
  score: { xWins: 0, oWins: 0, draws: 0 },
  isCpuThinking: false,
  gameOver: false,
  resultMessage: '',
  winningLine: null,
  moveHistory: [],
  reviewReport: null,
  selectedPiece: null,

  selectPiece: (pos: Vector4i | null) => {
    set({ selectedPiece: pos });
  },

  setBoardType: (type: BoardType) => {
    set({
      boardType: type,
      board: new BoardModel(type),
      gameOver: false,
      resultMessage: '',
      winningLine: null,
      moveHistory: [],
      reviewReport: null,
      isCpuThinking: false,
      selectedPiece: null,
    });
  },

  startNewGame: (mode: GameMode, order: PlayerTurnOrder = PlayerTurnOrder.First) => {
    let chosenOrder = order;
    if (order === PlayerTurnOrder.Random) {
      chosenOrder = Math.random() < 0.5 ? PlayerTurnOrder.First : PlayerTurnOrder.Second;
    }

    const currentBoardType = get().boardType;
    const newBoard = new BoardModel(currentBoardType);

    set({
      mode,
      turnOrder: chosenOrder,
      board: newBoard,
      currentTurn: 'X',
      gameOver: false,
      resultMessage: '',
      winningLine: null,
      moveHistory: [],
      reviewReport: null,
      isCpuThinking: false,
      selectedPiece: null,
    });

    // Si la CPU juega primero (TurnOrder.Second en PvCPU o en CPUvCPU)
    if ((mode === GameMode.PvCPU && chosenOrder === PlayerTurnOrder.Second) || mode === GameMode.CPUvCPU) {
      setTimeout(() => {
        get().executeCpuTurnIfNeeded();
      }, 300);
    }
  },

  restartCurrentGame: () => {
    const { mode, turnOrder } = get();
    get().startNewGame(mode, turnOrder);
  },

  resetScore: () => {
    set({ score: { xWins: 0, oWins: 0, draws: 0 } });
  },

  playMove: async (pos: Vector4i): Promise<boolean> => {
    const state = get();
    if (state.gameOver || state.isCpuThinking) return false;

    // En modalidad Movimiento durante la fase de movimiento:
    if (state.board.isMovement() && state.board.isMovementPhase()) {
      const cellContent = state.board.getCell(pos);
      const { selectedPiece } = state;

      // 1. Tocar una ficha propia
      if (cellContent === state.currentTurn) {
        if (selectedPiece && areVectorsEqual(selectedPiece, pos)) {
          // Deseleccionar si toca la misma
          set({ selectedPiece: null });
        } else {
          // Seleccionar ficha
          set({ selectedPiece: pos });
          HapticService.selection();
        }
        return true;
      }

      // 2. Si hay una ficha seleccionada y toca una casilla vacía adyacente
      if (selectedPiece && cellContent === ' ' && state.board.isAdjacent(selectedPiece, pos)) {
        return get().playPieceMove(selectedPiece, pos);
      }

      HapticService.warning();
      return false;
    }

    // En 4x4 gravedad, ajustar la fila a la más baja disponible
    let actualPos = { ...pos };
    if (state.board.hasGravity()) {
      const lowRow = state.board.getLowestAvailableRow(pos.y);
      if (lowRow === -1) {
        HapticService.warning();
        return false;
      }
      actualPos.x = lowRow;
    }

    if (!state.board.isCellEmpty(actualPos)) {
      HapticService.warning();
      return false;
    }

    const curSymbol = state.currentTurn;
    const success = state.board.makeMove(actualPos, curSymbol);
    if (!success) return false;

    // Sonido y háptico
    if (curSymbol === 'X') {
      AudioService.playMoveX();
    } else {
      AudioService.playMoveO();
    }
    HapticService.lightImpact();

    const updatedHistory: MoveRecord[] = [...state.moveHistory, { symbol: curSymbol, pos: actualPos }];

    // Comprobar ganador
    const { winner, winningLine } = state.board.checkWinner();

    if (winner !== ' ') {
      let msg = '';
      const newScore = { ...state.score };

      if (winner === 'X') {
        newScore.xWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria! Has ganado' : 'La CPU (X) ha ganado')
          : '¡Victoria para X!';
        AudioService.playWin();
        HapticService.success();
      } else if (winner === 'O') {
        newScore.oWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria! Has ganado' : 'La CPU (O) ha ganado')
          : '¡Victoria para O!';
        AudioService.playWin();
        HapticService.success();
      } else {
        newScore.draws++;
        msg = '¡Empate!';
        AudioService.playDraw();
        HapticService.mediumImpact();
      }

      const userSymbol = state.mode === GameMode.PvCPU
        ? (state.turnOrder === PlayerTurnOrder.First ? 'X' : 'O')
        : state.mode === GameMode.PvP ? 'X' : null;
      useStatsStore.getState().recordMatch(state.boardType, winner as 'X' | 'O' | 'D', userSymbol);

      const currentBoardType = state.boardType;
      set({
        board: state.board.clone(),
        moveHistory: updatedHistory,
        gameOver: true,
        resultMessage: msg,
        winningLine: winningLine || null,
        score: newScore,
        reviewReport: null,
        selectedPiece: null,
      });

      setTimeout(() => {
        try {
          const report = ReviewEngine.analyzeGame(currentBoardType, updatedHistory);
          const currentState = get();
          if (currentState.gameOver && currentState.moveHistory === updatedHistory) {
            set({ reviewReport: report });
            const userAcc = userSymbol === 'X' ? report.accuracyX : userSymbol === 'O' ? report.accuracyO : undefined;
            if (typeof userAcc === 'number') {
              useStatsStore.getState().updateLastMatchAccuracy(currentBoardType, userAcc);
            }
          }
        } catch {
          // No bloqueante
        }
      }, 50);

      return true;
    }

    // Cambiar turno
    const nextTurn = curSymbol === 'X' ? 'O' : 'X';
    set({
      board: state.board.clone(),
      currentTurn: nextTurn,
      moveHistory: updatedHistory,
      selectedPiece: null,
    });

    // Despachar turno de CPU si corresponde
    setTimeout(() => {
      get().executeCpuTurnIfNeeded();
    }, 50);

    return true;
  },

  playPieceMove: async (from: Vector4i, to: Vector4i): Promise<boolean> => {
    const state = get();
    if (state.gameOver || state.isCpuThinking) return false;

    const curSymbol = state.currentTurn;
    const success = state.board.movePiece(from, to, curSymbol);
    if (!success) return false;

    if (curSymbol === 'X') {
      AudioService.playMoveX();
    } else {
      AudioService.playMoveO();
    }
    HapticService.lightImpact();

    const updatedHistory: MoveRecord[] = [
      ...state.moveHistory,
      { symbol: curSymbol, pos: to, from },
    ];

    // Comprobar ganador tras mover ficha
    const { winner, winningLine } = state.board.checkWinner();

    if (winner !== ' ') {
      let msg = '';
      const newScore = { ...state.score };

      if (winner === 'X') {
        newScore.xWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria! Has ganado' : 'La CPU (X) ha ganado')
          : '¡Victoria para X!';
        AudioService.playWin();
        HapticService.success();
      } else if (winner === 'O') {
        newScore.oWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria! Has ganado' : 'La CPU (O) ha ganado')
          : '¡Victoria para O!';
        AudioService.playWin();
        HapticService.success();
      } else {
        newScore.draws++;
        msg = '¡Empate!';
        AudioService.playDraw();
        HapticService.mediumImpact();
      }

      const userSymbol = state.mode === GameMode.PvCPU
        ? (state.turnOrder === PlayerTurnOrder.First ? 'X' : 'O')
        : state.mode === GameMode.PvP ? 'X' : null;
      useStatsStore.getState().recordMatch(state.boardType, winner as 'X' | 'O' | 'D', userSymbol);

      const currentBoardType = state.boardType;
      set({
        board: state.board.clone(),
        moveHistory: updatedHistory,
        gameOver: true,
        resultMessage: msg,
        winningLine: winningLine || null,
        score: newScore,
        reviewReport: null,
        selectedPiece: null,
      });

      setTimeout(() => {
        try {
          const report = ReviewEngine.analyzeGame(currentBoardType, updatedHistory);
          const currentState = get();
          if (currentState.gameOver && currentState.moveHistory === updatedHistory) {
            set({ reviewReport: report });
            const userAcc = userSymbol === 'X' ? report.accuracyX : userSymbol === 'O' ? report.accuracyO : undefined;
            if (typeof userAcc === 'number') {
              useStatsStore.getState().updateLastMatchAccuracy(currentBoardType, userAcc);
            }
          }
        } catch {
          // No bloqueante
        }
      }, 50);

      return true;
    }

    // Verificar si el siguiente jugador queda inmovilizado (sin movimientos legales)
    const nextTurn = curSymbol === 'X' ? 'O' : 'X';
    if (state.board.getValidPieceMoves(nextTurn).length === 0) {
      // El rival no puede mover -> ¡Pierde por inmovilización!
      let msg = '';
      const newScore = { ...state.score };
      if (curSymbol === 'X') {
        newScore.xWins++;
        msg = '¡Victoria para X! (Oponente inmovilizado)';
        AudioService.playWin();
        HapticService.success();
      } else {
        newScore.oWins++;
        msg = '¡Victoria para O! (Oponente inmovilizado)';
        AudioService.playWin();
        HapticService.success();
      }

      const userSymbol = state.mode === GameMode.PvCPU
        ? (state.turnOrder === PlayerTurnOrder.First ? 'X' : 'O')
        : state.mode === GameMode.PvP ? 'X' : null;
      useStatsStore.getState().recordMatch(state.boardType, curSymbol as 'X' | 'O', userSymbol);

      set({
        board: state.board.clone(),
        moveHistory: updatedHistory,
        gameOver: true,
        resultMessage: msg,
        score: newScore,
        selectedPiece: null,
      });

      return true;
    }

    set({
      board: state.board.clone(),
      currentTurn: nextTurn,
      moveHistory: updatedHistory,
      selectedPiece: null,
    });

    setTimeout(() => {
      get().executeCpuTurnIfNeeded();
    }, 50);

    return true;
  },

  handleTimeout: (timedOutPlayer: CellSymbol) => {
    const state = get();
    if (state.gameOver) return;

    const winner: 'X' | 'O' = timedOutPlayer === 'X' ? 'O' : 'X';
    let msg = '';
    const newScore = { ...state.score };
    if (winner === 'X') {
      newScore.xWins++;
      msg = state.mode === GameMode.PvCPU
        ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria por tiempo! Has ganado' : 'La CPU (X) ha ganado por tiempo')
        : '¡Victoria por tiempo para X!';
      AudioService.playWin();
      HapticService.success();
    } else {
      newScore.oWins++;
      msg = state.mode === GameMode.PvCPU
        ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria por tiempo! Has ganado' : 'La CPU (O) ha ganado por tiempo')
        : '¡Victoria por tiempo para O!';
      AudioService.playWin();
      HapticService.success();
    }

    const userSymbol = state.mode === GameMode.PvCPU
      ? (state.turnOrder === PlayerTurnOrder.First ? 'X' : 'O')
      : state.mode === GameMode.PvP ? 'X' : null;
    useStatsStore.getState().recordMatch(state.boardType, winner, userSymbol);

    set({
      gameOver: true,
      resultMessage: msg,
      score: newScore,
      selectedPiece: null,
    });
  },

  executeCpuTurnIfNeeded: async () => {
    const state = get();
    if (state.gameOver) return;

    const isCpuTurn =
      state.mode === GameMode.CPUvCPU ||
      (state.mode === GameMode.PvCPU &&
        ((state.turnOrder === PlayerTurnOrder.First && state.currentTurn === 'O') ||
          (state.turnOrder === PlayerTurnOrder.Second && state.currentTurn === 'X')));

    if (!isCpuTurn) return;

    set({ isCpuThinking: true });

    const diff = useSettingsStore.getState().difficulties[state.boardType];
    const aiSymbol = state.currentTurn;
    const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';

    try {
      if (state.board.isMovement() && state.board.isMovementPhase()) {
        const bestPieceMove = await AIEngine.getBestPieceMoveAsync(state.board, aiSymbol, humanSymbol, diff, 450);
        set({ isCpuThinking: false });
        await get().playPieceMove(bestPieceMove.from, bestPieceMove.to);
      } else {
        const bestMove = await AIEngine.getBestMoveAsync(state.board, aiSymbol, humanSymbol, diff, 450);
        set({ isCpuThinking: false });
        await get().playMove(bestMove);
      }

      if (get().mode === GameMode.CPUvCPU && !get().gameOver) {
        setTimeout(() => {
          get().executeCpuTurnIfNeeded();
        }, 500);
      }
    } catch {
      set({ isCpuThinking: false });
    }
  },

  generateReviewReport: (): GameReviewReport => {
    const state = get();
    if (state.reviewReport) return state.reviewReport;
    const report = ReviewEngine.analyzeGame(state.boardType, state.moveHistory);
    set({ reviewReport: report });
    return report;
  },
}));
