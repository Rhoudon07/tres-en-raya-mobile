import React from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { useStatsStore } from '../stores/useStatsStore';
import { GameCard } from '../components/common/GameCard';
import { GameButton } from '../components/common/GameButton';
import { Badge } from '../components/common/Badge';
import { useDisableAndroidBack } from '../hooks/useDisableAndroidBack';

interface StatisticsScreenProps {
  navigation: any;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  useDisableAndroidBack();
  const stats = useStatsStore((state) => state.stats);
  const resetAllStats = useStatsStore((state) => state.resetAllStats);

  const winRate = stats.gamesPlayed > 0
    ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  const avgAccuracy = stats.accuracyCount > 0
    ? (stats.totalAccuracy / stats.accuracyCount).toFixed(1)
    : '0.0';

  const handleReset = () => {
    Alert.alert(
      'Reiniciar Estadísticas',
      '¿Estás seguro de que deseas borrar todas las partidas registradas? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: () => resetAllStats() },
      ]
    );
  };

  const modeNames: Record<BoardType, string> = {
    [BoardType.TicTacToe3x3]: '3x3 Clásico',
    [BoardType.Limited3x3]: 'Fichas Limitadas (3 máx)',
    [BoardType.Misere3x3]: '3x3 Misère (Inverso)',
    [BoardType.Movement3x3]: '3x3 Movimiento (Tapatan)',
    [BoardType.TimeAttack3x3]: '3x3 Contrarreloj (Blitz)',
    [BoardType.Connect4x4]: '4x4 Libre',
    [BoardType.Connect5x5]: '5x5 Libre',
    [BoardType.Gravity4x4]: '4x4 Gravedad',
    [BoardType.TicTacToe3D]: '3x3x3 3D (Qubic)',
    [BoardType.TicTacToe4x4_3D]: '4x4x4 3D (Qubic 4x4)',
    [BoardType.TicTacToe4D]: '3x3x3x3 4D (Teseracto)',
    [BoardType.Ultimate]: 'Ultimate (9 Tableros)',
    [BoardType.Obstacles4x4]: '4x4 con Obstáculos',
    [BoardType.ThreePlayers3x3]: '3 Jugadores (3x3)',
    [BoardType.Powers3x3]: '3x3 con Habilidades',
    [BoardType.Custom]: 'Modo Laboratorio',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>ESTADÍSTICAS GLOBALES</Text>
          <Text style={styles.subtitle}>Registro de partidas guardado en el dispositivo</Text>
        </View>

        {/* Resumen General */}
        <GameCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryVal}>{stats.gamesPlayed}</Text>
              <Text style={styles.summaryLbl}>PARTIDAS</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryVal, { color: Colors.accentGreen }]}>{stats.wins}</Text>
              <Text style={styles.summaryLbl}>VICTORIAS</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryVal, { color: Colors.playerO }]}>{stats.losses}</Text>
              <Text style={styles.summaryLbl}>DERROTAS</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryVal, { color: Colors.winLine }]}>{stats.draws}</Text>
              <Text style={styles.summaryLbl}>EMPATES</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Tasa de Victoria</Text>
              <Text style={[styles.kpiVal, { color: Colors.accentGreen }]}>{winRate}%</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Precisión Promedio</Text>
              <Text style={[styles.kpiVal, { color: Colors.accentCyan }]}>{avgAccuracy}%</Text>
            </View>
          </View>
        </GameCard>

        {/* Estadísticas por Modalidad */}
        <Text style={styles.sectionTitle}>DESGLOSE POR MODALIDAD</Text>

        {Object.values(BoardType).map((type) => {
          const m = stats.byMode[type];
          const mWinRate = m.played > 0 ? ((m.xWins / m.played) * 100).toFixed(1) : '0.0';
          const mAcc = m.accuracyCount > 0 ? (m.totalAccuracy / m.accuracyCount).toFixed(1) : '0.0';

          return (
            <GameCard key={type} style={styles.modeCard}>
              <View style={styles.modeHeader}>
                <Text style={styles.modeTitle}>{modeNames[type]}</Text>
                <Badge label={`${m.played} jugadas`} color={Colors.accentCyan} />
              </View>

              <View style={styles.modeMetrics}>
                <Text style={styles.metricItem}>X: <Text style={{ color: Colors.playerX }}>{m.xWins}</Text></Text>
                <Text style={styles.metricItem}>O: <Text style={{ color: Colors.playerO }}>{m.oWins}</Text></Text>
                <Text style={styles.metricItem}>Empates: <Text style={{ color: Colors.winLine }}>{m.draws}</Text></Text>
                <Text style={styles.metricItem}>Precisión: <Text style={{ color: Colors.reviewBest }}>{mAcc}%</Text></Text>
              </View>
            </GameCard>
          );
        })}

        {/* Botones de acción */}
        <GameButton
          title="REINICIAR ESTADÍSTICAS"
          variant="danger"
          size="medium"
          onPress={handleReset}
          style={styles.actionBtn}
        />

        <GameButton
          title="VOLVER"
          variant="outline"
          size="medium"
          onPress={() => navigation.goBack()}
          style={styles.actionBtn}
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
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 14,
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
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    marginVertical: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryBox: {
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  summaryLbl: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.boardBorder,
    marginVertical: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  kpiBox: {
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  modeCard: {
    marginVertical: 6,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricItem: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  actionBtn: {
    marginTop: 10,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
});
