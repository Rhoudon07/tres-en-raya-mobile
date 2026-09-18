import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { GameMode, PlayerTurnOrder } from '../types/game';
import { useGameStore } from '../stores/useGameStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ScoreBoard } from '../components/game/ScoreBoard';
import { TurnIndicator } from '../components/game/TurnIndicator';
import { Board2D } from '../components/board/Board2D';
import { BoardGravity } from '../components/board/BoardGravity';
import { Board3D } from '../components/board/Board3D';
import { Board4D } from '../components/board/Board4D';
import { BoardUltimate } from '../components/board/BoardUltimate';
import { ResultModal } from '../components/game/ResultModal';
import { ExitConfirmModal } from '../components/common/ExitConfirmModal';
import { GameTimer } from '../components/game/GameTimer';
import { GameButton } from '../components/common/GameButton';
import { PowerBar } from '../components/board/PowerBar';
import { Badge } from '../components/common/Badge';
import { useCampaignStore } from '../stores/useCampaignStore';
import { CAMPAIGN_LEVELS } from '../types/campaign';
import { GameModeWalkthroughModal } from '../components/common/GameModeWalkthroughModal';
import { WalkthroughService } from '../services/WalkthroughService';
import { Volume2, VolumeX, RotateCcw, X, HelpCircle } from 'lucide-react-native';

interface GameScreenProps {
  navigation: any;
}

export const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
  const boardType = useGameStore((state) => state.boardType);
  const board = useGameStore((state) => state.board);
  const mode = useGameStore((state) => state.mode);
  const turnOrder = useGameStore((state) => state.turnOrder);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const score = useGameStore((state) => state.score);
  const isCpuThinking = useGameStore((state) => state.isCpuThinking);
  const gameOver = useGameStore((state) => state.gameOver);
  const resultMessage = useGameStore((state) => state.resultMessage);
  const winningLine = useGameStore((state) => state.winningLine);
  const selectedPiece = useGameStore((state) => state.selectedPiece);
  const playMove = useGameStore((state) => state.playMove);
  const handleTimeout = useGameStore((state) => state.handleTimeout);
  const restartCurrentGame = useGameStore((state) => state.restartCurrentGame);
  const playerPowers = useGameStore((state) => state.playerPowers);
  const activePower = useGameStore((state) => state.activePower);
  const powerTargetFirst = useGameStore((state) => state.powerTargetFirst);
  const doubleTurnRemaining = useGameStore((state) => state.doubleTurnRemaining);
  const selectPower = useGameStore((state) => state.selectPower);

  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const diff = useSettingsStore((state) => state.difficulties[boardType]);

  const moveHistory = useGameStore((state) => state.moveHistory);
  const reviewReport = useGameStore((state) => state.reviewReport);
  const activeCampaignLevelId = useCampaignStore((state) => state.activeLevelId);
  const completeCampaignLevel = useCampaignStore((state) => state.completeLevel);

  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [earnedStars, setEarnedStars] = useState<number | undefined>(undefined);
  const [walkthroughVisible, setWalkthroughVisible] = useState<boolean>(false);

  const cpuSymbol = turnOrder === PlayerTurnOrder.First ? 'O' : 'X';
  const lastCpuMove = useMemo(() => {
    for (let i = moveHistory.length - 1; i >= 0; i--) {
      if (moveHistory[i].symbol === cpuSymbol) {
        return moveHistory[i].pos;
      }
    }
    return null;
  }, [moveHistory, cpuSymbol]);

  // Apertura automática del tutorial en el primer ingreso al modo
  useEffect(() => {
    WalkthroughService.hasSeen(boardType).then((seen) => {
      if (!seen) {
        setWalkthroughVisible(true);
      }
    });
  }, [boardType]);

  // Limpieza de memoria al desmontar la pantalla para evitar acumulación
  useEffect(() => {
    return () => {
      useGameStore.setState({
        isCpuThinking: false,
        activePower: null,
        powerTargetFirst: null,
        selectedPiece: null,
      });
    };
  }, []);

  // Sincronizar visibilidad del modal de resultado y evaluar progresión de campaña
  useEffect(() => {
    if (gameOver) {
      // Retardo estético de 700ms para permitir que la animación de la línea ganadora se trace y luzca en el tablero
      const modalTimer = setTimeout(() => {
        setResultModalVisible(true);
      }, 700);

      if (activeCampaignLevelId !== null) {
        const level = CAMPAIGN_LEVELS.find((l) => l.id === activeCampaignLevelId);
        const winner =
          winningLine && winningLine.length > 0
            ? board.getCell(winningLine[0])
            : resultMessage.includes('Empate')
            ? 'D'
            : resultMessage.includes('X')
            ? 'X'
            : ' ';

        if (winner === 'X' && level) {
          let stars = 1; // 1 estrella garantizada por victoria
          const userMoves = moveHistory.filter((m) => m.symbol === 'X').length;

          // Condición estrella 2
          const cond2 = level.starConditions[1];
          if (cond2.type === 'max_moves' && cond2.threshold) {
            if (userMoves <= cond2.threshold) stars++;
          } else if (cond2.type === 'no_timeout') {
            stars++;
          }

          // Condición estrella 3
          const cond3 = level.starConditions[2];
          const accuracy = reviewReport?.accuracyX ?? 85;
          if (cond3.type === 'min_accuracy' && cond3.threshold) {
            if (accuracy >= cond3.threshold) stars++;
          } else if (cond3.type === 'max_moves' && cond3.threshold) {
            if (userMoves <= cond3.threshold) stars++;
          }

          setEarnedStars(stars);
          completeCampaignLevel(activeCampaignLevelId, stars, userMoves, accuracy);
        } else {
          setEarnedStars(0);
        }
      } else {
        setEarnedStars(undefined);
      }

      return () => clearTimeout(modalTimer);
    } else {
      setResultModalVisible(false);
      setEarnedStars(undefined);
    }
  }, [gameOver, activeCampaignLevelId, winningLine, resultMessage, moveHistory, reviewReport, board]);

  const handleExitGame = () => {
    if (gameOver) {
      if (activeCampaignLevelId !== null) {
        navigation.navigate('Campaign');
      } else {
        navigation.navigate('Home');
      }
      return;
    }
    setExitModalVisible(true);
  };

  // Manejo del botón 'ir atrás' de Android:
  // - Si el modal de salida está abierto, lo cierra.
  // - Si el modal de resultado está abierto, lo cierra.
  // - Si no hay modal abierto, consulta al usuario con el modal temático si desea salir.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (walkthroughVisible) {
          setWalkthroughVisible(false);
          WalkthroughService.markSeen(boardType);
          return true;
        }
        if (exitModalVisible) {
          setExitModalVisible(false);
          return true;
        }
        if (resultModalVisible) {
          setResultModalVisible(false);
          return true;
        }
        handleExitGame();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [walkthroughVisible, exitModalVisible, resultModalVisible, gameOver, activeCampaignLevelId, boardType])
  );

  const handleCellPress = (pos: any) => {
    playMove(pos);
  };

  const handleGravityColPress = (col: number) => {
    playMove({ x: 0, y: col, z: 0, w: 0 });
  };

  const renderActiveBoard = () => {
    switch (boardType) {
      case BoardType.TicTacToe3x3:
      case BoardType.Connect4x4:
      case BoardType.Connect5x5:
      case BoardType.Limited3x3:
      case BoardType.Misere3x3:
      case BoardType.Movement3x3:
      case BoardType.TimeAttack3x3:
      case BoardType.Obstacles4x4:
      case BoardType.ThreePlayers3x3:
      case BoardType.ThreePlayers5x5:
      case BoardType.Powers3x3:
      case BoardType.Custom:
        return (
          <Board2D
            board={board}
            onCellPress={handleCellPress}
            winningLine={winningLine}
            currentTurn={currentTurn}
            selectedPiece={selectedPiece}
            activePower={activePower}
            powerTargetFirst={powerTargetFirst}
            disabled={isCpuThinking || gameOver}
          />
        );
      case BoardType.Gravity4x4:
        return (
          <BoardGravity
            board={board}
            onColumnPress={handleGravityColPress}
            winningLine={winningLine}
            disabled={isCpuThinking || gameOver}
          />
        );
      case BoardType.TicTacToe3D:
      case BoardType.TicTacToe4x4_3D:
        return (
          <Board3D
            board={board}
            onCellPress={handleCellPress}
            winningLine={winningLine}
            disabled={isCpuThinking || gameOver}
          />
        );
      case BoardType.TicTacToe4D:
        return (
          <Board4D
            board={board}
            onCellPress={handleCellPress}
            winningLine={winningLine}
            disabled={isCpuThinking || gameOver}
            lastCpuMove={lastCpuMove}
          />
        );
      case BoardType.Ultimate:
        return (
          <BoardUltimate
            board={board}
            onCellPress={handleCellPress}
            winningLine={winningLine}
            disabled={isCpuThinking || gameOver}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra superior de estado */}
        <View style={styles.topBar}>
          <View style={styles.badgesRow}>
            <Badge label={mode} color={Colors.accentCyan} />
            <Badge label={`IA: ${diff}`} color={Colors.winLine} style={{ marginLeft: 6 }} />
          </View>

          <View style={styles.topActions}>
            <GameButton
              icon={<HelpCircle size={17} color={Colors.accentCyan} />}
              title=""
              size="small"
              variant="outline"
              onPress={() => setWalkthroughVisible(true)}
              style={styles.iconBtn}
              accessibilityLabel="Ver tutorial de la modalidad"
            />
            <GameButton
              icon={
                soundEnabled ? (
                  <Volume2 size={17} color={Colors.accentCyan} />
                ) : (
                  <VolumeX size={17} color={Colors.textMuted} />
                )
              }
              title=""
              size="small"
              variant="outline"
              onPress={() => setSoundEnabled(!soundEnabled)}
              style={styles.iconBtn}
              accessibilityLabel="Alternar sonido"
            />
            <GameButton
              icon={<RotateCcw size={17} color={Colors.textPrimary} />}
              title=""
              size="small"
              variant="outline"
              onPress={restartCurrentGame}
              style={styles.iconBtn}
              accessibilityLabel="Reiniciar partida"
            />
            <GameButton
              icon={<X size={17} color={Colors.playerO} />}
              title=""
              size="small"
              variant="outline"
              onPress={handleExitGame}
              style={[styles.iconBtn, styles.exitBtn]}
              accessibilityLabel="Salir de la partida"
            />
          </View>
        </View>

        {/* Marcador */}
        <ScoreBoard score={score} />

        {/* Indicador de turno / Pensando */}
        <TurnIndicator
          currentTurn={currentTurn}
          isCpuThinking={isCpuThinking}
          gameOver={gameOver}
          resultMessage={resultMessage}
        />

        {/* Temporizador de alto rendimiento para Contrarreloj */}
        {boardType === BoardType.TimeAttack3x3 && (
          <GameTimer
            currentTurn={currentTurn}
            isCpuThinking={isCpuThinking}
            gameOver={gameOver}
            onTimeout={handleTimeout}
            secondsPerTurn={5}
          />
        )}

        {/* Guía de Fase para Modo Movimiento */}
        {boardType === BoardType.Movement3x3 && !gameOver && (
          <View style={styles.movementPhaseBanner}>
            <Text style={styles.movementPhaseText}>
              {!board.isMovementPhase()
                ? `📍 Fase de Colocación (${board.getPieceCount(currentTurn)}/3 fichas colocadas)`
                : selectedPiece
                ? `✨ Ficha seleccionada: Toca una casilla adyacente libre`
                : `👆 Tu turno: Selecciona una de tus fichas (${currentTurn}) para moverla`}
            </Text>
          </View>
        )}

        {/* Indicador de Doble Turno Activo en Modo Poderes */}
        {boardType === BoardType.Powers3x3 && !gameOver && doubleTurnRemaining > 0 && (
          <View style={[styles.movementPhaseBanner, { borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
            <Text style={[styles.movementPhaseText, { color: '#fb7185' }]}>
              🔄 ¡Doble Turno activo! Coloca tu 2ª ficha consecutiva ({currentTurn})
            </Text>
          </View>
        )}

        {/* Tablero de juego activo */}
        <View style={styles.boardContainer}>{renderActiveBoard()}</View>

        {/* Barra de Habilidades Tácticas en Modo Poderes */}
        {boardType === BoardType.Powers3x3 && !gameOver && (
          <PowerBar
            powers={currentTurn === 'X' ? playerPowers.X : playerPowers.O}
            activePower={activePower}
            onSelectPower={selectPower}
            disabled={isCpuThinking}
          />
        )}

        {/* Botones inferiores de acción */}
        <View style={styles.bottomControls}>
          {gameOver && !resultModalVisible ? (
            <>
              <GameButton
                title="VOLVER A JUGAR"
                variant="accent"
                size="medium"
                onPress={restartCurrentGame}
                style={styles.fullWidthBtn}
              />
              <View style={styles.secondaryRow}>
                <GameButton
                  title="VER RESULTADO"
                  variant="secondary"
                  size="small"
                  onPress={() => setResultModalVisible(true)}
                  style={styles.bottomBtn}
                />
                <GameButton
                  title={activeCampaignLevelId !== null ? 'VOLVER AL MAPA' : 'CAMBIAR MODO'}
                  variant="outline"
                  size="small"
                  onPress={() => {
                    if (activeCampaignLevelId !== null) {
                      navigation.navigate('Campaign');
                    } else {
                      navigation.navigate('BoardSelect');
                    }
                  }}
                  style={styles.bottomBtn}
                />
              </View>
            </>
          ) : (
            <View style={styles.secondaryRow}>
              <GameButton
                title="REINICIAR TABLERO"
                variant="secondary"
                size="small"
                onPress={restartCurrentGame}
                style={styles.bottomBtn}
              />
              <GameButton
                title="SALIR DE PARTIDA"
                variant="outline"
                size="small"
                onPress={handleExitGame}
                style={styles.bottomBtn}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de fin de partida */}
      <ResultModal
        visible={resultModalVisible}
        resultMessage={resultMessage}
        winner={
          winningLine && winningLine.length > 0
            ? board.getCell(winningLine[0])
            : board.checkWinner().winner !== ' '
            ? board.checkWinner().winner
            : resultMessage.includes('Empate')
            ? 'D'
            : resultMessage.includes('X')
            ? 'X'
            : resultMessage.includes('O')
            ? 'O'
            : resultMessage.includes('Y')
            ? 'Y'
            : mode === GameMode.PvCPU && resultMessage.includes('Derrota')
            ? (turnOrder === PlayerTurnOrder.First ? 'O' : 'X')
            : ' '
        }
        campaignStars={activeCampaignLevelId !== null ? earnedStars : undefined}
        onReturnToCampaign={
          activeCampaignLevelId !== null
            ? () => {
                setResultModalVisible(false);
                navigation.navigate('Campaign');
              }
            : undefined
        }
        onPlayAgain={() => {
          setResultModalVisible(false);
          restartCurrentGame();
        }}
        onAnalyze={() => {
          useGameStore.getState().generateReviewReport();
          setResultModalVisible(false);
          navigation.navigate('Review');
        }}
        onReturnToMenu={() => {
          setResultModalVisible(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }}
      />

      {/* Modal temático para salir de la partida */}
      <ExitConfirmModal
        visible={exitModalVisible}
        title="¿ABANDONAR PARTIDA?"
        message="¿Deseas salir al menú principal? La partida actual se dará por abandonada."
        confirmText="SALIR"
        cancelText="CONTINUAR"
        icon="⚔️"
        onConfirm={() => {
          setExitModalVisible(false);
          if (activeCampaignLevelId !== null) {
            navigation.navigate('Campaign');
          } else {
            navigation.navigate('Home');
          }
        }}
        onCancel={() => setExitModalVisible(false)}
      />

      {/* Modal de Tutorial / Walkthrough de la Modalidad */}
      <GameModeWalkthroughModal
        visible={walkthroughVisible}
        boardType={boardType}
        onClose={() => {
          setWalkthroughVisible(false);
          WalkthroughService.markSeen(boardType);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    marginLeft: 6,
  },
  exitBtn: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  boardContainer: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    marginTop: 10,
    maxWidth: 380,
    alignSelf: 'center',
    width: '100%',
  },
  fullWidthBtn: {
    width: '100%',
    marginVertical: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  bottomBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
  movementPhaseBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
  },
  movementPhaseText: {
    color: Colors.accentCyan,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
