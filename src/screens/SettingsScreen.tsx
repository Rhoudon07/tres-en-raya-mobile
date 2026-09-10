import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Switch } from 'react-native';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { Difficulty } from '../types/ai';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useStatsStore } from '../stores/useStatsStore';
import { GameCard } from '../components/common/GameCard';
import { GameButton } from '../components/common/GameButton';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const {
    soundEnabled,
    vibrationEnabled,
    animationsEnabled,
    showCoordinates,
    difficulties,
    setSoundEnabled,
    setVibrationEnabled,
    setAnimationsEnabled,
    setShowCoordinates,
    setDifficultyFor,
    resetSettings,
  } = useSettingsStore();

  const resetAllStats = useStatsStore((state) => state.resetAllStats);

  const modeLabels: Record<BoardType, string> = {
    [BoardType.TicTacToe3x3]: '3x3 Clásico',
    [BoardType.Connect4x4]: '4x4 Libre',
    [BoardType.Gravity4x4]: '4x4 Gravedad',
    [BoardType.TicTacToe3D]: '3D (Qubic)',
    [BoardType.TicTacToe4D]: '4D (Teseracto)',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>CONFIGURACIÓN</Text>
          <Text style={styles.subtitle}>Personaliza tu experiencia de juego</Text>
        </View>

        {/* 1. Preferencias del Sistema */}
        <Text style={styles.sectionHeader}>PREFERENCIAS GENERALES</Text>
        <GameCard style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Efectos de Sonido</Text>
              <Text style={styles.switchDesc}>Tonos sinusoidales y sintetizador procedimental</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#262d3d', true: '#005f73' }}
              thumbColor={soundEnabled ? Colors.accentCyan : Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Vibración y Hápticos</Text>
              <Text style={styles.switchDesc}>Respuesta táctil sutil en movimientos y victorias</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#262d3d', true: '#005f73' }}
              thumbColor={vibrationEnabled ? Colors.accentCyan : Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Animaciones Fluidas</Text>
              <Text style={styles.switchDesc}>Escalado de fichas y caída elástica 60 FPS</Text>
            </View>
            <Switch
              value={animationsEnabled}
              onValueChange={setAnimationsEnabled}
              trackColor={{ false: '#262d3d', true: '#005f73' }}
              thumbColor={animationsEnabled ? Colors.accentCyan : Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Mostrar Coordenadas 3D / 4D</Text>
              <Text style={styles.switchDesc}>Telemetría en tiempo real (X, Y, Z, W)</Text>
            </View>
            <Switch
              value={showCoordinates}
              onValueChange={setShowCoordinates}
              trackColor={{ false: '#262d3d', true: '#005f73' }}
              thumbColor={showCoordinates ? Colors.accentCyan : Colors.textMuted}
            />
          </View>
        </GameCard>

        {/* 2. Dificultad por Modalidad */}
        <Text style={styles.sectionHeader}>DIFICULTAD DE LA IA POR MODALIDAD</Text>
        {Object.values(BoardType).map((type) => {
          const currentDiff = difficulties[type];
          return (
            <GameCard key={type} style={styles.diffCard}>
              <Text style={styles.diffModeName}>{modeLabels[type]}</Text>
              <View style={styles.diffButtonGroup}>
                <GameButton
                  title="Fácil"
                  size="small"
                  active={currentDiff === Difficulty.Easy}
                  onPress={() => setDifficultyFor(type, Difficulty.Easy)}
                  style={styles.diffBtn}
                  textStyle={{ color: currentDiff === Difficulty.Easy ? Colors.accentGreen : undefined }}
                />
                <GameButton
                  title="Medio"
                  size="small"
                  active={currentDiff === Difficulty.Medium}
                  onPress={() => setDifficultyFor(type, Difficulty.Medium)}
                  style={styles.diffBtn}
                  textStyle={{ color: currentDiff === Difficulty.Medium ? Colors.winLine : undefined }}
                />
                <GameButton
                  title="Difícil"
                  size="small"
                  active={currentDiff === Difficulty.Hard}
                  onPress={() => setDifficultyFor(type, Difficulty.Hard)}
                  style={styles.diffBtn}
                  textStyle={{ color: currentDiff === Difficulty.Hard ? Colors.playerO : undefined }}
                />
              </View>
            </GameCard>
          );
        })}

        {/* 3. Acciones del Sistema */}
        <View style={styles.actionGroup}>
          <GameButton
            title="RESTAURAR AJUSTES POR DEFECTO"
            variant="secondary"
            size="medium"
            onPress={resetSettings}
          />

          <GameButton
            title="VOLVER"
            variant="outline"
            size="medium"
            onPress={() => navigation.goBack()}
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
    maxWidth: 260,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.boardBorder,
    marginVertical: 8,
  },
  diffCard: {
    marginVertical: 4,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  diffModeName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentCyan,
    marginBottom: 8,
  },
  diffButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diffBtn: {
    flex: 1,
    marginHorizontal: 3,
  },
  actionGroup: {
    marginTop: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
});
