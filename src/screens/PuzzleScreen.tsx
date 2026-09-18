import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Star,
  RefreshCw,
} from 'lucide-react-native';
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
  const currentDifficulty = usePuzzleStore((state) => state.currentDifficulty);
  const roundPuzzles = usePuzzleStore((state) => state.roundPuzzles);
  const roundIndex = usePuzzleStore((state) => state.roundIndex);
  const currentPuzzle = usePuzzleStore((state) => state.currentPuzzle);
  const board = usePuzzleStore((state) => state.board);
  const isSolved = usePuzzleStore((state) => state.isSolved);
  const isFailed = usePuzzleStore((state) => state.isFailed);
  const feedbackMessage = usePuzzleStore((state) => state.feedbackMessage);
  const completedPuzzleIds = usePuzzleStore((state) => state.completedPuzzleIds);
  const selectedPiece = usePuzzleStore((state) => state.selectedPiece);
  const failedInRound = usePuzzleStore((state) => state.failedInRound);
  const isRepeatingFailed = usePuzzleStore((state) => state.isRepeatingFailed);
  const allCompleted = usePuzzleStore((state) => state.allCompleted);

  const playMove = usePuzzleStore((state) => state.playMove);
  const retryPuzzle = usePuzzleStore((state) => state.retryPuzzle);
  const nextPuzzle = usePuzzleStore((state) => state.nextPuzzle);
  const startDifficultyRound = usePuzzleStore((state) => state.startDifficultyRound);

  // Auto-avance al fallar para no dar la respuesta y pasar al siguiente desafío
  useEffect(() => {
    if (isFailed) {
      const timer = setTimeout(() => {
        nextPuzzle();
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [isFailed, nextPuzzle]);

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
            title=""
            icon={<ArrowLeft size={20} color="#fff" />}
            size="small"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
          <View style={styles.titleColumn}>
            <Text style={styles.screenTitle}>DESAFÍOS TÁCTICOS</Text>
            <Text style={styles.screenSubtitle}>
              {isRepeatingFailed ? 'Repetición de Fallidos' : `Ronda ${currentDifficulty.toUpperCase()}`} • Desafío {roundIndex + 1} de {roundPuzzles.length}
            </Text>
          </View>
          <View style={styles.badgesGroup}>
            {isRepeatingFailed && (
              <Badge
                label="REPETICIÓN"
                color="#f59e0b"
                icon={<RefreshCw size={10} color="#f59e0b" />}
                style={{ marginRight: 6 }}
              />
            )}
            <Badge
              label={currentPuzzle.difficulty.toUpperCase()}
              color={difficultyColor}
            />
          </View>
        </View>

        {/* Consigna del Desafío */}
        <GameCard style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <Text style={styles.missionTitle}>{currentPuzzle.title}</Text>
            {isCompleted && (
              <View style={styles.solvedBadgeContainer}>
                <Star size={13} color="#eab308" fill="#eab308" style={{ marginRight: 4 }} />
                <Text style={styles.starBadgeText}>Resuelto</Text>
              </View>
            )}
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
            disabled={isSolved || isFailed}
          />
        </View>

        {/* Estado: Éxito */}
        {isSolved && (
          <GameCard style={styles.successCard}>
            <View style={styles.cardHeaderRow}>
              <CheckCircle2 size={20} color="#4ade80" style={{ marginRight: 8 }} />
              <Text style={styles.successTitle}>¡DESAFÍO COMPLETADO!</Text>
            </View>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            <GameButton
              title="SIGUIENTE DESAFÍO"
              icon={<ArrowRight size={16} color="#000" />}
              size="medium"
              variant="accent"
              onPress={nextPuzzle}
              style={styles.actionBtn}
            />
          </GameCard>
        )}

        {/* Estado: Fallo (Sin revelar respuesta, avanza al siguiente) */}
        {isFailed && (
          <GameCard style={styles.failCard}>
            <View style={styles.cardHeaderRow}>
              <XCircle size={20} color="#f87171" style={{ marginRight: 8 }} />
              <Text style={styles.failTitle}>JUGADA INCORRECTA</Text>
            </View>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            <GameButton
              title="SIGUIENTE DESAFÍO"
              icon={<ArrowRight size={16} color="#fff" />}
              size="medium"
              variant="outline"
              onPress={nextPuzzle}
              style={styles.actionBtn}
            />
          </GameCard>
        )}

        {/* Todos los desafíos completados */}
        {allCompleted && (
          <GameCard style={styles.completedCard}>
            <Trophy size={42} color="#eab308" style={{ marginBottom: 8 }} />
            <Text style={styles.completedTitle}>¡TODOS LOS DESAFÍOS COMPLETADOS!</Text>
            <Text style={styles.completedText}>
              Has superado con éxito todas las dificultades de los desafíos tácticos.
            </Text>
            <GameButton
              title="REINICIAR DESDE NIVEL FÁCIL"
              icon={<RotateCcw size={16} color="#000" />}
              size="medium"
              variant="accent"
              onPress={() => startDifficultyRound('easy')}
              style={styles.actionBtn}
            />
          </GameCard>
        )}

        {/* Selector de Dificultades de Ronda */}
        <View style={styles.diffSelectorRow}>
          <GameButton
            title="FÁCIL"
            size="small"
            variant={currentDifficulty === 'easy' ? 'accent' : 'outline'}
            onPress={() => startDifficultyRound('easy')}
            style={styles.diffBtn}
          />
          <GameButton
            title="MEDIO"
            size="small"
            variant={currentDifficulty === 'medium' ? 'accent' : 'outline'}
            onPress={() => startDifficultyRound('medium')}
            style={styles.diffBtn}
          />
          <GameButton
            title="DIFÍCIL"
            size="small"
            variant={currentDifficulty === 'hard' ? 'accent' : 'outline'}
            onPress={() => startDifficultyRound('hard')}
            style={styles.diffBtn}
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
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 11,
    marginTop: 2,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  solvedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  starBadgeText: {
    color: '#eab308',
    fontWeight: '800',
    fontSize: 11,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
    fontSize: 15,
    fontWeight: '900',
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
  completedCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
    borderWidth: 1.5,
    marginTop: 10,
    alignItems: 'center',
    padding: 16,
  },
  completedTitle: {
    color: '#facc15',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  completedText: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  diffSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  diffBtn: {
    flex: 1,
    marginHorizontal: 3,
  },
});
