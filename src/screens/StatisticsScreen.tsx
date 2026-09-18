import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { useStatsStore, MatchRecord } from '../stores/useStatsStore';
import { GameCard } from '../components/common/GameCard';
import { GameButton } from '../components/common/GameButton';
import { Badge } from '../components/common/Badge';
import { useDisableAndroidBack } from '../hooks/useDisableAndroidBack';
import { BarChart2, History, Trophy, XCircle, MinusCircle, Trash2, Clock } from 'lucide-react-native';

interface StatisticsScreenProps {
  navigation: any;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  useDisableAndroidBack();
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  const stats = useStatsStore((state) => state.stats);
  const matchHistory = useStatsStore((state) => state.matchHistory);
  const resetAllStats = useStatsStore((state) => state.resetAllStats);
  const clearHistory = useStatsStore((state) => state.clearHistory);

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
    [BoardType.ThreePlayers5x5]: '3 Jugadores (5x5)',
    [BoardType.Powers3x3]: '5x5 con Habilidades',
    [BoardType.Custom]: 'Modo Laboratorio',
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Borrar Historial',
      '¿Deseas eliminar el registro de partidas recientes? Los totales acumulados se conservarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => clearHistory() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>REGISTRO DE JUEGO</Text>
          <Text style={styles.subtitle}>
            Estadísticas y archivo de partidas en el dispositivo
          </Text>
        </View>

        {/* Selector de Pestaña Segmentado */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
            onPress={() => setActiveTab('stats')}
          >
            <BarChart2
              size={16}
              color={activeTab === 'stats' ? Colors.accentCyan : Colors.textMuted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'stats' && styles.tabButtonTextActive]}
            >
              ESTADÍSTICAS
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => setActiveTab('history')}
          >
            <History
              size={16}
              color={activeTab === 'history' ? Colors.accentCyan : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'history' && styles.tabButtonTextActive,
              ]}
            >
              HISTORIAL ({matchHistory.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'stats' ? (
          <>
            {/* Resumen General */}
            <GameCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryVal}>{stats.gamesPlayed}</Text>
                  <Text style={styles.summaryLbl}>PARTIDAS</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: Colors.accentGreen }]}>
                    {stats.wins}
                  </Text>
                  <Text style={styles.summaryLbl}>VICTORIAS</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: Colors.playerO }]}>
                    {stats.losses}
                  </Text>
                  <Text style={styles.summaryLbl}>DERROTAS</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: Colors.winLine }]}>
                    {stats.draws}
                  </Text>
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
                    <Text style={styles.metricItem}>
                      X: <Text style={{ color: Colors.playerX }}>{m.xWins}</Text>
                    </Text>
                    <Text style={styles.metricItem}>
                      O: <Text style={{ color: Colors.playerO }}>{m.oWins}</Text>
                    </Text>
                    <Text style={styles.metricItem}>
                      Empates: <Text style={{ color: Colors.winLine }}>{m.draws}</Text>
                    </Text>
                    <Text style={styles.metricItem}>
                      Precisión: <Text style={{ color: Colors.reviewBest }}>{mAcc}%</Text>
                    </Text>
                  </View>
                </GameCard>
              );
            })}

            <GameButton
              title="REINICIAR ESTADÍSTICAS"
              variant="danger"
              size="medium"
              onPress={handleReset}
              style={styles.actionBtn}
            />
          </>
        ) : (
          <>
            {/* Pestaña: Historial de Partidas */}
            {matchHistory.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <History size={44} color="#334155" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyHistoryTitle}>Sin partidas en el historial</Text>
                <Text style={styles.emptyHistoryDesc}>
                  Juega partidas en cualquier modalidad y aquí quedará guardado tu registro
                  con fecha, turnos y precisión táctica.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.historyHeaderRow}>
                  <Text style={styles.sectionTitle}>PARTIDAS RECIENTES ({matchHistory.length})</Text>
                  <Pressable
                    onPress={handleClearHistory}
                    style={styles.clearHistoryBtn}
                    accessibilityLabel="Borrar historial"
                  >
                    <Trash2 size={13} color="#ef4444" />
                    <Text style={styles.clearHistoryText}>Borrar historial</Text>
                  </Pressable>
                </View>

                {matchHistory.map((m) => {
                  const d = new Date(m.timestamp);
                  const timeStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

                  const resultBadge =
                    m.result === 'win' ? (
                      <Badge
                        label="VICTORIA"
                        color={Colors.accentGreen}
                        icon={<Trophy size={11} color={Colors.accentGreen} />}
                      />
                    ) : m.result === 'loss' ? (
                      <Badge
                        label="DERROTA"
                        color={Colors.playerO}
                        icon={<XCircle size={11} color={Colors.playerO} />}
                      />
                    ) : (
                      <Badge
                        label="EMPATE"
                        color={Colors.winLine}
                        icon={<MinusCircle size={11} color={Colors.winLine} />}
                      />
                    );

                  const modeDesc =
                    m.mode === 'PvCPU'
                      ? `vs CPU (${m.difficulty || 'Medio'})`
                      : m.mode === 'PvP'
                      ? '2 Jugadores Local'
                      : 'CPU vs CPU';

                  return (
                    <GameCard key={m.id} style={styles.historyCard}>
                      <View style={styles.historyCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyModeTitle}>
                            {modeNames[m.boardType] || m.boardType}
                          </Text>
                          <View style={styles.historyTimeRow}>
                            <Clock size={11} color={Colors.textMuted} />
                            <Text style={styles.historyTimeText}>{timeStr}</Text>
                          </View>
                        </View>
                        {resultBadge}
                      </View>

                      <View style={styles.historyDivider} />

                      <View style={styles.historyDetailsRow}>
                        <Text style={styles.historyDetailText}>{modeDesc}</Text>
                        <Text style={styles.historyDetailText}>
                          {m.movesCount} {m.movesCount === 1 ? 'movimiento' : 'movimientos'}
                        </Text>
                        {m.accuracy !== undefined && (
                          <Text style={[styles.historyDetailText, { color: Colors.accentCyan }]}>
                            {m.accuracy}% Precisión
                          </Text>
                        )}
                      </View>
                    </GameCard>
                  );
                })}
              </>
            )}
          </>
        )}

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
    marginTop: 12,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#121622',
    borderColor: '#1e2638',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#1b2438',
    borderColor: Colors.accentCyan,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  tabButtonTextActive: {
    color: Colors.textPrimary,
  },
  emptyHistoryBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1,
    borderRadius: 18,
    marginVertical: 14,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyHistoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearHistoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  historyCard: {
    marginVertical: 5,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 12,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyModeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  historyTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  historyTimeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.boardBorder,
    marginVertical: 8,
  },
  historyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
