import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { useGameStore } from '../stores/useGameStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ScoreBoard } from '../components/game/ScoreBoard';
import { TurnIndicator } from '../components/game/TurnIndicator';
import { Board2D } from '../components/board/Board2D';
import { BoardGravity } from '../components/board/BoardGravity';
import { Board3D } from '../components/board/Board3D';
import { Board4D } from '../components/board/Board4D';
import { ResultModal } from '../components/game/ResultModal';
import { GameButton } from '../components/common/GameButton';
import { Badge } from '../components/common/Badge';

interface GameScreenProps {
  navigation: any;
}

export const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
  const boardType = useGameStore((state) => state.boardType);
  const board = useGameStore((state) => state.board);
  const mode = useGameStore((state) => state.mode);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const score = useGameStore((state) => state.score);
  const isCpuThinking = useGameStore((state) => state.isCpuThinking);
  const gameOver = useGameStore((state) => state.gameOver);
  const resultMessage = useGameStore((state) => state.resultMessage);
  const winningLine = useGameStore((state) => state.winningLine);
  const playMove = useGameStore((state) => state.playMove);
  const restartCurrentGame = useGameStore((state) => state.restartCurrentGame);

  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const diff = useSettingsStore((state) => state.difficulties[boardType]);

  const [resultModalVisible, setResultModalVisible] = useState(false);

  // Sincronizar visibilidad del modal de resultado con el estado del juego
  useEffect(() => {
    if (gameOver) {
      setResultModalVisible(true);
    } else {
      setResultModalVisible(false);
    }
  }, [gameOver]);

  // Manejo del botón 'ir atrás' de Android:
  // - Si el modal de resultado está abierto, lo cierra.
  // - Si no hay modal abierto, bloquea el botón para forzar navegación por los botones de la pantalla.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (resultModalVisible) {
          setResultModalVisible(false);
          return true;
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [resultModalVisible])
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
        return (
          <Board2D
            board={board}
            onCellPress={handleCellPress}
            winningLine={winningLine}
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
              title={soundEnabled ? '🔊' : '🔇'}
              size="small"
              variant="outline"
              onPress={() => setSoundEnabled(!soundEnabled)}
              style={styles.iconBtn}
              accessibilityLabel="Alternar sonido"
            />
            <GameButton
              title="↺"
              size="small"
              variant="outline"
              onPress={restartCurrentGame}
              style={styles.iconBtn}
              accessibilityLabel="Reiniciar partida"
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

        {/* Tablero de juego activo */}
        <View style={styles.boardContainer}>{renderActiveBoard()}</View>

        {/* Botones inferiores de acción */}
        <View style={styles.bottomControls}>
          {gameOver && !resultModalVisible ? (
            <GameButton
              title="VER RESULTADO"
              variant="accent"
              size="small"
              onPress={() => setResultModalVisible(true)}
              style={styles.bottomBtn}
            />
          ) : (
            <GameButton
              title="REINICIAR TABLERO"
              variant="secondary"
              size="small"
              onPress={restartCurrentGame}
              style={styles.bottomBtn}
            />
          )}
          <GameButton
            title="CAMBIAR MODO"
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('BoardSelect')}
            style={styles.bottomBtn}
          />
        </View>
      </ScrollView>

      {/* Modal de fin de partida */}
      <ResultModal
        visible={resultModalVisible}
        resultMessage={resultMessage}
        winner={
          winningLine && winningLine.length > 0
            ? board.getCell(winningLine[0])
            : resultMessage.includes('Empate')
            ? 'D'
            : ' '
        }
        onPlayAgain={() => {
          setResultModalVisible(false);
          restartCurrentGame();
        }}
        onAnalyze={() => {
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
  boardContainer: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    maxWidth: 380,
    alignSelf: 'center',
    width: '100%',
  },
  bottomBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
