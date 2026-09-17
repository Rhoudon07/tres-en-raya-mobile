import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { GameMode, PlayerTurnOrder } from '../types/game';
import { Difficulty } from '../types/ai';
import { useGameStore } from '../stores/useGameStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GameButton } from '../components/common/GameButton';
import { GameCard } from '../components/common/GameCard';
import { useDisableAndroidBack } from '../hooks/useDisableAndroidBack';

interface GameModeScreenProps {
  navigation: any;
}

export const GameModeScreen: React.FC<GameModeScreenProps> = ({ navigation }) => {
  useDisableAndroidBack();
  const boardType = useGameStore((state) => state.boardType);
  const startNewGame = useGameStore((state) => state.startNewGame);

  const difficulties = useSettingsStore((state) => state.difficulties);
  const setDifficultyFor = useSettingsStore((state) => state.setDifficultyFor);

  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.PvCPU);
  const [turnOrder, setTurnOrder] = useState<PlayerTurnOrder>(PlayerTurnOrder.First);

  const currentDiff = difficulties[boardType];

  const handleStartGame = () => {
    startNewGame(selectedMode, turnOrder);
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>CONFIGURA LA PARTIDA</Text>
          <Text style={styles.subtitle}>Modalidad activa: {boardType}</Text>
        </View>

        {/* 1. Selección de Modo de Rival */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. RIVAL DE JUEGO</Text>

          <GameButton
            title="JUGADOR VS COMPUTADORA (PvCPU)"
            active={selectedMode === GameMode.PvCPU}
            variant={selectedMode === GameMode.PvCPU ? 'accent' : 'secondary'}
            onPress={() => setSelectedMode(GameMode.PvCPU)}
          />

          <GameButton
            title="JUGADOR VS JUGADOR (PvP Local)"
            active={selectedMode === GameMode.PvP}
            variant={selectedMode === GameMode.PvP ? 'accent' : 'secondary'}
            onPress={() => setSelectedMode(GameMode.PvP)}
          />

          <GameButton
            title="COMPUTADORA VS COMPUTADORA (Espectador)"
            active={selectedMode === GameMode.CPUvCPU}
            variant={selectedMode === GameMode.CPUvCPU ? 'accent' : 'secondary'}
            onPress={() => setSelectedMode(GameMode.CPUvCPU)}
          />
        </View>

        {/* 2. Opciones específicas de PvCPU */}
        {selectedMode === GameMode.PvCPU && (
          <GameCard style={styles.cpuConfigCard}>
            <Text style={styles.sectionTitle}>2. ORDEN DE TURNO</Text>
            <View style={styles.buttonGroup}>
              <GameButton
                title="1º (X) Inicias tú"
                size="small"
                active={turnOrder === PlayerTurnOrder.First}
                onPress={() => setTurnOrder(PlayerTurnOrder.First)}
                style={styles.groupBtn}
              />
              <GameButton
                title="2º (O) Inicia CPU"
                size="small"
                active={turnOrder === PlayerTurnOrder.Second}
                onPress={() => setTurnOrder(PlayerTurnOrder.Second)}
                style={styles.groupBtn}
              />
              <GameButton
                title="Aleatorio"
                size="small"
                active={turnOrder === PlayerTurnOrder.Random}
                onPress={() => setTurnOrder(PlayerTurnOrder.Random)}
                style={styles.groupBtn}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>3. DIFICULTAD IA</Text>
            <View style={styles.buttonGroup}>
              <GameButton
                title="Fácil"
                size="small"
                active={currentDiff === Difficulty.Easy}
                onPress={() => setDifficultyFor(boardType, Difficulty.Easy)}
                style={styles.groupBtn}
                textStyle={{ color: currentDiff === Difficulty.Easy ? Colors.accentGreen : undefined }}
              />
              <GameButton
                title="Medio"
                size="small"
                active={currentDiff === Difficulty.Medium}
                onPress={() => setDifficultyFor(boardType, Difficulty.Medium)}
                style={styles.groupBtn}
                textStyle={{ color: currentDiff === Difficulty.Medium ? Colors.winLine : undefined }}
              />
              <GameButton
                title="Difícil"
                size="small"
                active={currentDiff === Difficulty.Hard}
                onPress={() => setDifficultyFor(boardType, Difficulty.Hard)}
                style={styles.groupBtn}
                textStyle={{ color: currentDiff === Difficulty.Hard ? Colors.playerO : undefined }}
              />
            </View>
          </GameCard>
        )}

        {/* Botones de acción inferior */}
        <View style={styles.actionRow}>
          <GameButton
            title="¡COMENZAR PARTIDA!"
            size="large"
            variant="accent"
            onPress={handleStartGame}
            style={styles.startBtn}
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentCyan,
    marginTop: 4,
  },
  section: {
    marginVertical: 10,
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  cpuConfigCard: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    marginVertical: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupBtn: {
    flex: 1,
    marginHorizontal: 3,
  },
  actionRow: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    marginTop: 16,
  },
  startBtn: {
    marginBottom: 8,
  },
});
