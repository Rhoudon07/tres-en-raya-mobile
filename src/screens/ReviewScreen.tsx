import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { BoardModel } from '../game/board/BoardModel';
import { useGameStore } from '../stores/useGameStore';
import { Board2D } from '../components/board/Board2D';
import { BoardGravity } from '../components/board/BoardGravity';
import { Board3D } from '../components/board/Board3D';
import { Board4D } from '../components/board/Board4D';
import { ReviewCard } from '../components/review/ReviewCard';
import { ReviewControls } from '../components/review/ReviewControls';
import { AccuracyBar } from '../components/common/AccuracyBar';
import { GameButton } from '../components/common/GameButton';
import { useDisableAndroidBack } from '../hooks/useDisableAndroidBack';

interface ReviewScreenProps {
  navigation: any;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation }) => {
  useDisableAndroidBack();
  const boardType = useGameStore((state) => state.boardType);
  const moveHistory = useGameStore((state) => state.moveHistory || []);
  const generateReviewReport = useGameStore((state) => state.generateReviewReport);

  const totalSteps = moveHistory.length;
  const [currentStep, setCurrentStep] = useState<number>(totalSteps);

  // Sincronizar el paso actual cada vez que cambia el historial de movimientos
  useEffect(() => {
    setCurrentStep(totalSteps);
  }, [totalSteps]);

  // Paso seguro garantizado dentro de [0, totalSteps]
  const safeStep = Math.max(0, Math.min(currentStep, totalSteps));

  const report = useMemo(() => {
    try {
      return generateReviewReport();
    } catch {
      return { analyses: [], accuracyX: 100, accuracyO: 100, moveHistory: [] };
    }
  }, [boardType, moveHistory]);

  // Reconstruir el estado del tablero hasta el paso actual de forma estrictamente segura
  const simBoard = useMemo(() => {
    const b = new BoardModel(boardType);
    for (let i = 0; i < safeStep; ++i) {
      const move = moveHistory[i];
      if (move && move.pos && move.symbol) {
        b.makeMove(move.pos, move.symbol);
      }
    }
    return b;
  }, [boardType, moveHistory, safeStep]);

  // Si estamos en el último paso y hubo ganador, obtener la línea ganadora
  const winningLine = useMemo(() => {
    if (safeStep === totalSteps && totalSteps > 0) {
      const { winner, winningLine: line } = simBoard.checkWinner();
      if (winner !== ' ' && winner !== 'D') {
        return line || null;
      }
    }
    return null;
  }, [simBoard, safeStep, totalSteps]);

  const currentAnalysis =
    safeStep > 0 && report?.analyses && report.analyses[safeStep - 1]
      ? report.analyses[safeStep - 1]
      : null;

  const currentTurnSymbol =
    safeStep > 0 && moveHistory[safeStep - 1]
      ? moveHistory[safeStep - 1].symbol
      : '';

  const suggestedCell =
    currentAnalysis &&
    currentAnalysis.suggestedMove &&
    currentAnalysis.suggestedMove.x !== -1
      ? currentAnalysis.suggestedMove
      : null;

  const renderSimBoard = () => {
    switch (boardType) {
      case BoardType.TicTacToe3x3:
      case BoardType.Connect4x4:
      case BoardType.Connect5x5:
        return (
          <Board2D
            board={simBoard}
            onCellPress={() => {}}
            winningLine={winningLine}
            suggestedCell={suggestedCell}
            disabled={true}
          />
        );
      case BoardType.Gravity4x4:
        return (
          <BoardGravity
            board={simBoard}
            onColumnPress={() => {}}
            winningLine={winningLine}
            suggestedCell={suggestedCell}
            disabled={true}
          />
        );
      case BoardType.TicTacToe3D:
      case BoardType.TicTacToe4x4_3D:
        return (
          <Board3D
            board={simBoard}
            onCellPress={() => {}}
            winningLine={winningLine}
            suggestedCell={suggestedCell}
            disabled={true}
          />
        );
      case BoardType.TicTacToe4D:
        return (
          <Board4D
            board={simBoard}
            onCellPress={() => {}}
            winningLine={winningLine}
            suggestedCell={suggestedCell}
            disabled={true}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.title}>ANÁLISIS DE PARTIDA</Text>
          <Text style={styles.subtitle}>
            Evaluación pedagógica y táctica con motor Minimax
          </Text>
        </View>

        {/* Barra de Precisión Global */}
        <AccuracyBar
          accuracyX={report?.accuracyX ?? 100}
          accuracyO={report?.accuracyO ?? 100}
        />

        {/* Tarjeta de la jugada actual */}
        <ReviewCard
          currentStep={safeStep}
          totalSteps={totalSteps}
          currentTurnSymbol={currentTurnSymbol}
          analysis={currentAnalysis}
        />

        {/* Tablero en este paso con celda sugerida en verde esmeralda */}
        <View style={styles.boardContainer}>{renderSimBoard()}</View>

        {/* Controles de Navegación jugada a jugada */}
        <ReviewControls
          currentStep={safeStep}
          totalSteps={totalSteps}
          onGoToStart={() => setCurrentStep(0)}
          onPrev={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
          onGoToEnd={() => setCurrentStep(totalSteps)}
        />

        {/* Botón para regresar al juego o menú */}
        <GameButton
          title="VOLVER A LA PARTIDA"
          variant="secondary"
          size="medium"
          onPress={() => navigation.goBack()}
          style={styles.exitBtn}
        />
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accentCyan,
    marginTop: 2,
    textAlign: 'center',
  },
  boardContainer: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtn: {
    marginTop: 12,
    maxWidth: 380,
    alignSelf: 'center',
    width: '100%',
  },
});
