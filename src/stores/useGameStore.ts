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

import { PowerType, PlayerPowers, createInitialPlayerPowers, markPlayerPowerUsed } from '../types/powers';
import { getBestDecisionPowers } from '../game/ai/MinimaxPowers';
import { CustomGameRules } from '../types/lab';

interface GameStoreState {
  boardType: BoardType;
  customRules?: CustomGameRules;
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

  // Propiedades para modalidad de Poderes
  playerPowers: { X: PlayerPowers; O: PlayerPowers };
  activePower: PowerType | null;
  powerTargetFirst: Vector4i | null;
  doubleTurnRemaining: number;

  // Acciones
  setBoardType: (type: BoardType, customRules?: CustomGameRules) => void;
  startNewGame: (mode: GameMode, order?: PlayerTurnOrder) => void;
  restartCurrentGame: () => void;
  selectPiece: (pos: Vector4i | null) => void;
  selectPower: (power: PowerType | null) => void;
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
  playerPowers: { X: createInitialPlayerPowers(), O: createInitialPlayerPowers() },
  activePower: null,
  powerTargetFirst: null,
  doubleTurnRemaining: 0,

  selectPiece: (pos: Vector4i | null) => {
    set({ selectedPiece: pos });
  },

  selectPower: (power: PowerType | null) => {
    set({ activePower: power, powerTargetFirst: null });
  },

  setBoardType: (type: BoardType, customRules?: CustomGameRules) => {
    set({
      boardType: type,
      customRules,
      board: new BoardModel(type, customRules),
      gameOver: false,
      resultMessage: '',
      winningLine: null,
      moveHistory: [],
      reviewReport: null,
      isCpuThinking: false,
      selectedPiece: null,
      playerPowers: { X: createInitialPlayerPowers(), O: createInitialPlayerPowers() },
      activePower: null,
      powerTargetFirst: null,
      doubleTurnRemaining: 0,
    });
  },

  startNewGame: (mode: GameMode, order: PlayerTurnOrder = PlayerTurnOrder.First) => {
    let chosenOrder = order;
    if (order === PlayerTurnOrder.Random) {
      chosenOrder = Math.random() < 0.5 ? PlayerTurnOrder.First : PlayerTurnOrder.Second;
    }

    const currentBoardType = get().boardType;
    const currentRules = get().customRules;
    const newBoard = new BoardModel(currentBoardType, currentRules);

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
      playerPowers: { X: createInitialPlayerPowers(), O: createInitialPlayerPowers() },
      activePower: null,
      powerTargetFirst: null,
      doubleTurnRemaining: 0,
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

    // En modalidad Poderes con poder activo:
    let isActivatingDoubleTurn = false;
    if (state.board.isPowers() && state.activePower) {
      const curSym = state.currentTurn as 'X' | 'O';
      const powers = {
        X: { ...state.playerPowers.X },
        O: { ...state.playerPowers.O },
      };
      const curPowers = powers[curSym];

      // 1. BOMBA
      if (state.activePower === PowerType.Bomb) {
        if (state.board.isCellEmpty(pos) || state.board.isCellBlocked(pos)) {
          HapticService.warning();
          return false;
        }
        const success = state.board.clearCell(pos);
        if (!success) return false;

        powers[curSym] = markPlayerPowerUsed(curPowers, PowerType.Bomb);
        AudioService.playMoveX();
        HapticService.heavyImpact();

        const updatedHistory: MoveRecord[] = [...state.moveHistory, { symbol: curSym, pos }];
        const nextTurn = curSym === 'X' ? 'O' : 'X';
        set({
          board: state.board.clone(),
          playerPowers: powers,
          activePower: null,
          currentTurn: nextTurn,
          moveHistory: updatedHistory,
        });

        setTimeout(() => {
          get().executeCpuTurnIfNeeded();
        }, 50);
        return true;
      }

      // 2. BLOQUEO DE CASILLA
      if (state.activePower === PowerType.BlockCell) {
        if (!state.board.isCellEmpty(pos)) {
          HapticService.warning();
          return false;
        }
        const success = state.board.setObstacleCell(pos);
        if (!success) return false;

        powers[curSym] = markPlayerPowerUsed(curPowers, PowerType.BlockCell);
        AudioService.playMoveO();
        HapticService.mediumImpact();

        const updatedHistory: MoveRecord[] = [...state.moveHistory, { symbol: curSym, pos }];
        const nextTurn = curSym === 'X' ? 'O' : 'X';
        set({
          board: state.board.clone(),
          playerPowers: powers,
          activePower: null,
          currentTurn: nextTurn,
          moveHistory: updatedHistory,
        });

        setTimeout(() => {
          get().executeCpuTurnIfNeeded();
        }, 50);
        return true;
      }

      // 3. INTERCAMBIO CUÁNTICO (SWAP)
      if (state.activePower === PowerType.Swap) {
        if (state.board.isCellEmpty(pos) || state.board.isCellBlocked(pos)) {
          HapticService.warning();
          return false;
        }

        if (!state.powerTargetFirst) {
          set({ powerTargetFirst: pos });
          HapticService.selection();
          return true;
        } else {
          const firstPos = state.powerTargetFirst;
          if (areVectorsEqual(firstPos, pos)) {
            set({ powerTargetFirst: null });
            return true;
          }

          const success = state.board.swapCells(firstPos, pos);
          if (!success) {
            HapticService.warning();
            return false;
          }

          powers[curSym] = markPlayerPowerUsed(curPowers, PowerType.Swap);
          AudioService.playMoveX();
          HapticService.heavyImpact();

          const updatedHistory: MoveRecord[] = [...state.moveHistory, { symbol: curSym, pos, from: firstPos }];

          const { winner, winningLine } = state.board.checkWinner();
          if (winner !== ' ') {
            const newScore = { ...state.score };
            let msg = '';
            if (winner === 'X') {
              newScore.xWins++;
              msg = state.mode === GameMode.PvCPU
                ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria! Has ganado' : 'Derrota')
                : '¡Victoria para X!';
              AudioService.playWin();
            } else if (winner === 'O') {
              newScore.oWins++;
              msg = state.mode === GameMode.PvCPU
                ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria! Has ganado' : 'Derrota')
                : '¡Victoria para O!';
              AudioService.playWin();
            } else {
              newScore.draws++;
              msg = '¡Empate!';
              AudioService.playDraw();
            }
            set({
              board: state.board.clone(),
              playerPowers: powers,
              activePower: null,
              powerTargetFirst: null,
              gameOver: true,
              resultMessage: msg,
              winningLine: winningLine || null,
              score: newScore,
              moveHistory: updatedHistory,
            });
            return true;
          }

          const nextTurn = curSym === 'X' ? 'O' : 'X';
          set({
            board: state.board.clone(),
            playerPowers: powers,
            activePower: null,
            powerTargetFirst: null,
            currentTurn: nextTurn,
            moveHistory: updatedHistory,
          });

          setTimeout(() => {
            get().executeCpuTurnIfNeeded();
          }, 50);
          return true;
        }
      }

      // 4. DOBLE TURNO
      if (state.activePower === PowerType.DoubleTurn) {
        isActivatingDoubleTurn = true;
      }
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

    // Si se activó Doble Turno con este movimiento, marcarlo en playerPowers
    let powersToUpdate = state.playerPowers;
    if (isActivatingDoubleTurn) {
      powersToUpdate = {
        ...state.playerPowers,
        [curSymbol]: markPlayerPowerUsed(state.playerPowers[curSymbol as 'X' | 'O'], PowerType.DoubleTurn),
      };
    }

    // Comprobar ganador
    const { winner, winningLine } = state.board.checkWinner();

    if (winner !== ' ') {
      let msg = '';
      const newScore = { ...state.score };

      if (winner === 'X') {
        newScore.xWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria! Has ganado' : 'Derrota')
          : '¡Victoria para X!';
        AudioService.playWin();
        HapticService.success();
      } else if (winner === 'O') {
        newScore.oWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria! Has ganado' : 'Derrota')
          : '¡Victoria para O!';
        AudioService.playWin();
        HapticService.success();
      } else if (winner === 'Y') {
        newScore.yWins = (newScore.yWins || 0) + 1;
        msg = state.mode === GameMode.PvCPU
          ? 'Derrota'
          : '¡Victoria para Y!';
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
      useStatsStore.getState().recordMatch(state.boardType, winner as any, userSymbol);

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
        activePower: null,
        doubleTurnRemaining: 0,
        playerPowers: powersToUpdate,
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
    let nextTurn: CellSymbol = state.board.isThreePlayers()
      ? (curSymbol === 'X' ? 'O' : curSymbol === 'O' ? 'Y' : 'X')
      : (curSymbol === 'X' ? 'O' : 'X');

    let newDoubleTurnRemaining = isActivatingDoubleTurn
      ? 1
      : state.doubleTurnRemaining > 0
      ? state.doubleTurnRemaining - 1
      : 0;

    if (state.board.isPowers() && (isActivatingDoubleTurn || state.doubleTurnRemaining > 0)) {
      if (newDoubleTurnRemaining > 0) {
        nextTurn = curSymbol; // Mantiene el turno para la segunda ficha
      }
    }

    set({
      board: state.board.clone(),
      currentTurn: nextTurn,
      doubleTurnRemaining: newDoubleTurnRemaining,
      moveHistory: updatedHistory,
      selectedPiece: null,
      activePower: null,
      playerPowers: powersToUpdate,
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
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria! (Oponente inmovilizado)' : 'Derrota (Inmovilizado)')
          : '¡Victoria para X! (Oponente inmovilizado)';
        AudioService.playWin();
        HapticService.success();
      } else {
        newScore.oWins++;
        msg = state.mode === GameMode.PvCPU
          ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria! (Oponente inmovilizado)' : 'Derrota (Inmovilizado)')
          : '¡Victoria para O! (Oponente inmovilizado)';
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
        ? (state.turnOrder === PlayerTurnOrder.First ? '¡Victoria por tiempo! Has ganado' : 'Derrota (Por tiempo)')
        : '¡Victoria por tiempo para X!';
      AudioService.playWin();
      HapticService.success();
    } else {
      newScore.oWins++;
      msg = state.mode === GameMode.PvCPU
        ? (state.turnOrder === PlayerTurnOrder.Second ? '¡Victoria por tiempo! Has ganado' : 'Derrota (Por tiempo)')
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
        (state.board.isThreePlayers()
          ? (state.currentTurn === 'O' || state.currentTurn === 'Y')
          : ((state.turnOrder === PlayerTurnOrder.First && state.currentTurn === 'O') ||
             (state.turnOrder === PlayerTurnOrder.Second && state.currentTurn === 'X'))));

    if (!isCpuTurn) return;

    set({ isCpuThinking: true });

    const diff = useSettingsStore.getState().difficulties[state.boardType];
    const aiSymbol = state.currentTurn;
    const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';

    try {
      if (state.board.isPowers()) {
        const p = state.playerPowers[aiSymbol as 'X' | 'O'] || createInitialPlayerPowers();
        const decision = getBestDecisionPowers(state.board, aiSymbol, humanSymbol, p, diff);

        if (decision.powerToUse === PowerType.Bomb && decision.powerTarget) {
          get().selectPower(PowerType.Bomb);
          set({ isCpuThinking: false });
          await get().playMove(decision.powerTarget);
          return;
        }

        if (decision.powerToUse === PowerType.BlockCell && decision.powerTarget) {
          get().selectPower(PowerType.BlockCell);
          set({ isCpuThinking: false });
          await get().playMove(decision.powerTarget);
          return;
        }

        if (decision.powerToUse === PowerType.Swap && decision.powerTarget && decision.powerTargetB) {
          get().selectPower(PowerType.Swap);
          await get().playMove(decision.powerTarget);
          set({ isCpuThinking: false });
          await get().playMove(decision.powerTargetB);
          return;
        }

        if (decision.powerToUse === PowerType.DoubleTurn) {
          get().selectPower(PowerType.DoubleTurn);
          set({ isCpuThinking: false });
          await get().playMove(decision.move);
          return;
        }

        set({ isCpuThinking: false });
        await get().playMove(decision.move);
      } else if (state.board.isMovement() && state.board.isMovementPhase()) {
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
