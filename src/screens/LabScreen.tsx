import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import {
  CustomGameRules,
  LabDimension,
  createDefaultCustomRules,
  serializeRules,
  deserializeRules,
} from '../types/lab';
import { useGameStore } from '../stores/useGameStore';
import { GameButton } from '../components/common/GameButton';
import { GameCard } from '../components/common/GameCard';
import { Badge } from '../components/common/Badge';
import { HapticService } from '../services/HapticService';
import { useDisableAndroidBack } from '../hooks/useDisableAndroidBack';

interface LabScreenProps {
  navigation: any;
}

export const LabScreen: React.FC<LabScreenProps> = ({ navigation }) => {
  useDisableAndroidBack();
  const setBoardType = useGameStore((state) => state.setBoardType);

  const [rules, setRules] = useState<CustomGameRules>(createDefaultCustomRules());
  const [seedInput, setSeedInput] = useState<string>('');

  const currentSeed = serializeRules(rules);

  const updateDimension = (dim: LabDimension) => {
    HapticService.selection();
    setRules((prev) => {
      let winCondition = prev.winCondition;
      let gravity = prev.gravity;

      // Restricciones coherentes según dimensión
      if (dim === '3x3') {
        winCondition = 3;
      } else if (dim === '4x4' && winCondition === 5) {
        winCondition = 4;
      }

      if (dim === '3D' || dim === '4D') {
        gravity = false;
        winCondition = 3;
      }

      return {
        ...prev,
        dimension: dim,
        winCondition,
        gravity,
      };
    });
  };

  const applyPreset = (presetRules: CustomGameRules) => {
    HapticService.mediumImpact();
    setRules(presetRules);
  };

  const handleImportSeed = () => {
    if (!seedInput.trim()) {
      Alert.alert('Código vacío', 'Ingresa un código de semilla válido.');
      return;
    }
    const parsed = deserializeRules(seedInput.trim());
    if (parsed) {
      setRules(parsed);
      setSeedInput('');
      HapticService.success();
      Alert.alert('¡Reglas importadas!', 'Las reglas se han cargado correctamente.');
    } else {
      HapticService.warning();
      Alert.alert('Semilla inválida', 'El formato del código no es reconocido.');
    }
  };

  const handleStartCustomGame = () => {
    HapticService.heavyImpact();
    setBoardType(BoardType.Custom, rules);
    navigation.navigate('GameMode');
  };

  const dimensions: LabDimension[] = ['3x3', '4x4', '5x5', '3D', '4D'];
  const winConditions = [3, 4, 5];
  const limitedOptions = [0, 3, 4, 5];
  const obstacleOptions = [0, 1, 2, 3, 4, 5];
  const timerOptions = [0, 3, 5, 10, 15];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.title}>MODO LABORATORIO</Text>
          <Text style={styles.subtitle}>
            Sandbox y editor de reglas personalizadas
          </Text>
        </View>

        {/* Tarjeta de Semilla */}
        <GameCard style={styles.seedCard}>
          <Text style={styles.seedLabel}>CÓDIGO DE SEMILLA DE LA PARTIDA</Text>
          <Text style={styles.seedCode} selectable>
            {currentSeed}
          </Text>

          <View style={styles.importRow}>
            <TextInput
              style={styles.seedTextInput}
              placeholder="Pegar código de semilla..."
              placeholderTextColor={Colors.textMuted}
              value={seedInput}
              onChangeText={setSeedInput}
              autoCapitalize="characters"
            />
            <GameButton
              title="CARGAR"
              size="small"
              variant="secondary"
              onPress={handleImportSeed}
              style={{ minWidth: 80 }}
            />
          </View>
        </GameCard>

        {/* Presets Rápidos */}
        <Text style={styles.sectionTitle}>PRESETS RECOMENDADOS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          <Pressable
            style={styles.presetBtn}
            onPress={() =>
              applyPreset({
                dimension: '3x3',
                winCondition: 3,
                gravity: false,
                limitedPieces: 0,
                misere: false,
                obstacles: 0,
                turnTimer: 5,
                playerCount: 2,
              })
            }
          >
            <Text style={styles.presetTitle}>⚡ Blitz 5s</Text>
            <Text style={styles.presetDesc}>3x3 con contrarreloj rápido</Text>
          </Pressable>

          <Pressable
            style={styles.presetBtn}
            onPress={() =>
              applyPreset({
                dimension: '3x3',
                winCondition: 3,
                gravity: false,
                limitedPieces: 0,
                misere: true,
                obstacles: 2,
                turnTimer: 5,
                playerCount: 3,
              })
            }
          >
            <Text style={styles.presetTitle}>🌌 Caos Total</Text>
            <Text style={styles.presetDesc}>3 Jugadores, Misère y Rocas</Text>
          </Pressable>

          <Pressable
            style={styles.presetBtn}
            onPress={() =>
              applyPreset({
                dimension: '4x4',
                winCondition: 4,
                gravity: true,
                limitedPieces: 0,
                misere: false,
                obstacles: 0,
                turnTimer: 0,
                playerCount: 2,
              })
            }
          >
            <Text style={styles.presetTitle}>⬇️ Conecta Cuatro</Text>
            <Text style={styles.presetDesc}>4x4 con física gravitatoria</Text>
          </Pressable>

          <Pressable
            style={styles.presetBtn}
            onPress={() =>
              applyPreset({
                dimension: '3x3',
                winCondition: 3,
                gravity: false,
                limitedPieces: 3,
                misere: false,
                obstacles: 0,
                turnTimer: 0,
                playerCount: 2,
              })
            }
          >
            <Text style={styles.presetTitle}>⏳ Memoria FIFO</Text>
            <Text style={styles.presetDesc}>3 fichas máx con desvanecimiento</Text>
          </Pressable>
        </ScrollView>

        {/* 1. Selector de Dimensión */}
        <Text style={styles.sectionTitle}>1. DIMENSIÓN DEL TABLERO</Text>
        <View style={styles.optionsRow}>
          {dimensions.map((dim) => {
            const active = rules.dimension === dim;
            return (
              <Pressable
                key={dim}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => updateDimension(dim)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {dim}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 2. Fichas para ganar */}
        <Text style={styles.sectionTitle}>2. FICHAS EN LÍNEA PARA GANAR</Text>
        <View style={styles.optionsRow}>
          {winConditions.map((wc) => {
            const disabled =
              (rules.dimension === '3x3' && wc > 3) ||
              (rules.dimension === '4x4' && wc > 4) ||
              ((rules.dimension === '3D' || rules.dimension === '4D') && wc > 3);
            const active = rules.winCondition === wc;

            return (
              <Pressable
                key={wc}
                disabled={disabled}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                  disabled && styles.chipDisabled,
                ]}
                onPress={() => {
                  HapticService.selection();
                  setRules((p) => ({ ...p, winCondition: wc }));
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                    disabled && styles.chipTextDisabled,
                  ]}
                >
                  {wc} en línea
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3. Gravedad y Misère */}
        <Text style={styles.sectionTitle}>3. MECÁNICAS ESPECIALES</Text>
        <GameCard style={styles.togglesCard}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Física de Gravedad</Text>
              <Text style={styles.toggleSub}>
                {rules.dimension === '3D' || rules.dimension === '4D'
                  ? 'No disponible en tableros 3D/4D'
                  : 'Las fichas caen a la fila más baja'}
              </Text>
            </View>
            <Switch
              value={rules.gravity}
              disabled={rules.dimension === '3D' || rules.dimension === '4D'}
              onValueChange={(val) => {
                HapticService.selection();
                setRules((p) => ({ ...p, gravity: val }));
              }}
              thumbColor={rules.gravity ? Colors.accentCyan : '#475569'}
              trackColor={{ false: '#1e293b', true: 'rgba(0, 212, 255, 0.4)' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Regla Misère (Inversa)</Text>
              <Text style={styles.toggleSub}>
                Quien conecte la línea ganadora PIERDE
              </Text>
            </View>
            <Switch
              value={rules.misere}
              onValueChange={(val) => {
                HapticService.selection();
                setRules((p) => ({ ...p, misere: val }));
              }}
              thumbColor={rules.misere ? '#ef4444' : '#475569'}
              trackColor={{ false: '#1e293b', true: 'rgba(239, 68, 68, 0.4)' }}
            />
          </View>
        </GameCard>

        {/* 4. Fichas limitadas */}
        <Text style={styles.sectionTitle}>4. FICHAS LIMITADAS (FIFO)</Text>
        <View style={styles.optionsRow}>
          {limitedOptions.map((lim) => {
            const active = rules.limitedPieces === lim;
            return (
              <Pressable
                key={lim}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  HapticService.selection();
                  setRules((p) => ({ ...p, limitedPieces: lim }));
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {lim === 0 ? 'Sin límite' : `${lim} máx`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 5. Obstáculos */}
        <Text style={styles.sectionTitle}>5. DENSIDAD DE OBSTÁCULOS (#)</Text>
        <View style={styles.optionsRow}>
          {obstacleOptions.map((obs) => {
            const active = rules.obstacles === obs;
            return (
              <Pressable
                key={obs}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  HapticService.selection();
                  setRules((p) => ({ ...p, obstacles: obs }));
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {obs === 0 ? '0 (Ninguno)' : `${obs} rocas`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 6. Temporizador */}
        <Text style={styles.sectionTitle}>6. TEMPORIZADOR POR TURNO</Text>
        <View style={styles.optionsRow}>
          {timerOptions.map((t) => {
            const active = rules.turnTimer === t;
            return (
              <Pressable
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  HapticService.selection();
                  setRules((p) => ({ ...p, turnTimer: t }));
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t === 0 ? 'Infinito' : `${t}s`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 7. Jugadores */}
        <Text style={styles.sectionTitle}>7. NÚMERO DE JUGADORES</Text>
        <View style={styles.optionsRow}>
          {[2, 3].map((count) => {
            const active = rules.playerCount === count;
            return (
              <Pressable
                key={count}
                style={[styles.chip, { flex: 1 }, active && styles.chipActive]}
                onPress={() => {
                  HapticService.selection();
                  setRules((p) => ({ ...p, playerCount: count as 2 | 3 }));
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {count === 2 ? '2 Jugadores (X vs O)' : '3 Jugadores (X, O, Y)'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Botón Principal de Inicio */}
        <View style={styles.actionContainer}>
          <GameButton
            title="JUGAR EN LABORATORIO"
            variant="accent"
            size="large"
            onPress={handleStartCustomGame}
            style={styles.startBtn}
          />
          <GameButton
            title="VOLVER"
            variant="outline"
            size="medium"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.accentCyan,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  seedCard: {
    padding: 14,
    marginBottom: 16,
  },
  seedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  seedCode: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.playerX,
    letterSpacing: 1,
    paddingVertical: 4,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  seedTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.cellNormal,
    borderColor: Colors.cellBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  presetBtn: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 140,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.cellNormal,
    borderColor: Colors.cellBorder,
    borderWidth: 1.5,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: Colors.accentCyan,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.accentCyan,
  },
  chipTextDisabled: {
    color: Colors.textMuted,
  },
  togglesCard: {
    padding: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.boardBorder,
    marginVertical: 10,
  },
  actionContainer: {
    marginTop: 24,
    gap: 12,
  },
  startBtn: {
    width: '100%',
  },
  backBtn: {
    width: '100%',
  },
});
