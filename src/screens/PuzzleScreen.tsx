import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { usePuzzleStore } from '../stores/usePuzzleStore';
import { PUZZLE_CATALOG } from '../game/puzzles/PuzzleCatalog';
import { Board2D } from '../components/board/Board2D';
import { GameButton } from '../components/common/GameButton';
import { Badge } from '../components/common/Badge';
import { GameCard } from '../components/common/GameCard';
import { Vector4i } from '../types/board';

interface PuzzleScreenProps {
  navigation: any;
}

export const PuzzleScreen: React.FC<PuzzleScreenProps> = ({ navigation }) => {
  const currentPuzzleIndex = usePuzzleStore((state) => state.currentPuzzleIndex);
  const currentPuzzle = usePuzzleStore((state) => state.currentPuzzle);
  const board = usePuzzleStore((state) => state.board);
  const isSolved = usePuzzleStore((state) => state.isSolved);
  const isFailed = usePuzzleStore((state) => state.isFailed);
  const feedbackMessage = usePuzzleStore((state) => state.feedbackMessage);
  const completedPuzzleIds = usePuzzleStore((state) => state.completedPuzzleIds);
  const selectedPiece = usePuzzleStore((state) => state.selectedPiece);
  const playMove = usePuzzleStore((state) => state.playMove);
  const retryPuzzle = usePuzzleStore((state) => state.retryPuzzle);
  const nextPuzzle = usePuzzleStore((state) => state.nextPuzzle);
  const loadPuzzle = usePuzzleStore((state) => state.loadPuzzle);

  const handleCellPress = (pos: Vector4i) => {
    playMove(pos);
  };

  const difficultyColor =
    currentPuzzle.difficulty === 'easy'
      ? Colors.accentGreen
      : currentPuzzle.difficulty === 'medium'
      ? '#f59e0b'
      : '#ef4444';

  const isCompleted = completedPuzzleIds.includes(currentPuzzle.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra Superior */}
        <View style={styles.topBar}>
          <GameButton
            title="←"
            size="small"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
          <View style={styles.titleColumn}>
            <Text style={styles.screenTitle}>DESAFÍOS TÁCTICOS</Text>
            <Text style={styles.screenSubtitle}>
              Nivel {currentPuzzleIndex + 1} de {PUZZLE_CATALOG.length}
            </Text>
          </View>
          <Badge
            label={currentPuzzle.difficulty.toUpperCase()}
            color={difficultyColor}
          />
        </View>

        {/* Consigna del Puzzle */}
        <GameCard style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <Text style={styles.missionTitle}>{currentPuzzle.title}</Text>
            {isCompleted && <Text style={styles.starBadge}>⭐ Resuelto</Text>}
          </View>
          <Text style={styles.missionDesc}>
            {currentPuzzle.subtitle} • Juegas con ({currentPuzzle.playerSymbol})
          </Text>
        </GameCard>

        {/* Tablero de Juego */}
        <View style={styles.boardContainer}>
          <Board2D
            board={board}
            onCellPress={handleCellPress}
            currentTurn={currentPuzzle.playerSymbol}
            selectedPiece={selectedPiece}
            disabled={isSolved}
          />
        </View>

        {/* Retroalimentación de Éxito / Error */}
        {isSolved && (
          <GameCard style={styles.successCard}>
            <Text style={styles.successTitle}>🎉 ¡DESAFÍO COMPLETADO!</Text>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            {currentPuzzleIndex < PUZZLE_CATALOG.length - 1 ? (
              <GameButton
                title="SIGUIENTE DESAFÍO →"
                size="medium"
                variant="accent"
                onPress={nextPuzzle}
                style={styles.actionBtn}
              />
            ) : (
              <Text style={styles.completedAllText}>
                🏆 ¡Has completado todos los desafíos tácticos disponibles!
              </Text>
            )}
          </GameCard>
        )}

        {isFailed && (
          <GameCard style={styles.failCard}>
            <Text style={styles.failTitle}>❌ JUGADA INCORRECTA</Text>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            <GameButton
              title="REINTENTAR"
              size="medium"
              variant="outline"
              onPress={retryPuzzle}
              style={styles.actionBtn}
            />
          </GameCard>
        )}

        {/* Controles de Navegación de Puzzles */}
        <View style={styles.navigationRow}>
          <GameButton
            title="← ANTERIOR"
            size="small"
            variant="outline"
            disabled={currentPuzzleIndex === 0}
            onPress={() => loadPuzzle(currentPuzzleIndex - 1)}
            style={styles.navBtn}
          />
          <GameButton
            title="REINICIAR"
            size="small"
            variant="outline"
            onPress={retryPuzzle}
            style={styles.navBtn}
          />
          <GameButton
            title="SIGUIENTE →"
            size="small"
            variant="outline"
            disabled={currentPuzzleIndex >= PUZZLE_CATALOG.length - 1}
            onPress={nextPuzzle}
            style={styles.navBtn}
          />
        </View>
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
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
  },
  titleColumn: {
    alignItems: 'center',
  },
  screenTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  screenSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  missionCard: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  missionTitle: {
    color: Colors.accentCyan,
    fontSize: 16,
    fontWeight: '800',
  },
  missionDesc: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  starBadge: {
    color: '#eab308',
    fontWeight: '800',
    fontSize: 12,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  successCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1.5,
    marginTop: 10,
    alignItems: 'center',
  },
  successTitle: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  failCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1.5,
    marginTop: 10,
    alignItems: 'center',
  },
  failTitle: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  feedbackText: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  actionBtn: {
    width: '100%',
    marginTop: 4,
  },
  completedAllText: {
    color: '#eab308',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  navBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
