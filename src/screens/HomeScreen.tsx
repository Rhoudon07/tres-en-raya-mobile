import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, StatusBar, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { GameButton } from '../components/common/GameButton';
import { ExitConfirmModal } from '../components/common/ExitConfirmModal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useStatsStore } from '../stores/useStatsStore';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadStats = useStatsStore((state) => state.loadStats);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // Manejar el botón 'ir atrás' del sistema Android en el Menú Principal
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (exitModalVisible) {
          setExitModalVisible(false);
          return true;
        }
        setExitModalVisible(true);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [exitModalVisible])
  );

  // --- Animaciones de Fondo Dinámico Neón (Reanimated UI-Thread) ---
  // 1. Orbe Cian (Jugador X)
  const orbCyanY = useSharedValue(0);
  const orbCyanX = useSharedValue(0);
  const orbCyanScale = useSharedValue(0.9);
  const orbCyanOpacity = useSharedValue(0.12);

  // 2. Orbe Rosa (Jugador O)
  const orbPinkY = useSharedValue(0);
  const orbPinkX = useSharedValue(0);
  const orbPinkScale = useSharedValue(0.95);
  const orbPinkOpacity = useSharedValue(0.10);

  // 3. Anillo de pulso cuántico expansivo
  const pulseWave = useSharedValue(0);

  // 4. Fichas cósmicas flotantes y en rotación continua
  const rotX1 = useSharedValue(0);
  const floatX1 = useSharedValue(0);

  const rotO1 = useSharedValue(0);
  const floatO1 = useSharedValue(0);

  const floatO2 = useSharedValue(0);
  const floatX2 = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    loadSettings();
    loadStats();

    // 1. Orbe Cian
    orbCyanY.value = withRepeat(
      withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orbCyanX.value = withRepeat(
      withTiming(20, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orbCyanScale.value = withRepeat(
      withTiming(1.3, { duration: 3400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orbCyanOpacity.value = withRepeat(
      withTiming(0.24, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // 2. Orbe Rosa
    orbPinkY.value = withRepeat(
      withTiming(-35, { duration: 4600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orbPinkX.value = withRepeat(
      withTiming(-25, { duration: 5800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orbPinkScale.value = withRepeat(
      withTiming(1.25, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orbPinkOpacity.value = withRepeat(
      withTiming(0.22, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // 3. Anillo de pulso cuántico central
    pulseWave.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // 4. Fichas cósmicas
    rotX1.value = withRepeat(
      withTiming(360, { duration: 26000, easing: Easing.linear }),
      -1,
      false
    );
    floatX1.value = withRepeat(
      withTiming(25, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    rotO1.value = withRepeat(
      withTiming(-360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
    floatO1.value = withRepeat(
      withTiming(-25, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    floatO2.value = withRepeat(
      withTiming(18, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    floatX2.value = withRepeat(
      withTiming(-16, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    floatY.value = withRepeat(
      withTiming(14, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const styleOrbCyan = useAnimatedStyle(() => ({
    transform: [
      { translateY: orbCyanY.value },
      { translateX: orbCyanX.value },
      { scale: orbCyanScale.value },
    ],
    opacity: orbCyanOpacity.value,
  }));

  const styleOrbPink = useAnimatedStyle(() => ({
    transform: [
      { translateY: orbPinkY.value },
      { translateX: orbPinkX.value },
      { scale: orbPinkScale.value },
    ],
    opacity: orbPinkOpacity.value,
  }));

  const stylePulseRing = useAnimatedStyle(() => ({
    transform: [{ scale: 0.5 + pulseWave.value * 1.5 }],
    opacity: (1 - pulseWave.value) * 0.28,
  }));

  const styleX1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatX1.value },
      { rotate: `${rotX1.value}deg` },
    ],
  }));

  const styleO1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatO1.value },
      { rotate: `${rotO1.value}deg` },
    ],
  }));

  const styleO2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatO2.value },
      { rotate: `${floatO2.value * 0.8}deg` },
    ],
  }));

  const styleX2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatX2.value },
      { rotate: `${floatX2.value * -0.7}deg` },
    ],
  }));

  const styleY = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: 1 + (floatY.value / 14) * 0.1 },
    ],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Contenedor de fondo animado (sin bloquear eventos táctiles) */}
      <View style={styles.animatedBgContainer} pointerEvents="none">
        {/* Orbe resplandeciente Cian (Jugador X) */}
        <Animated.View style={[styles.bgGlowCyan, styleOrbCyan]} />

        {/* Orbe resplandeciente Rosa (Jugador O) */}
        <Animated.View style={[styles.bgGlowPink, styleOrbPink]} />

        {/* Anillo de pulso cuántico expansivo */}
        <Animated.View style={[styles.bgPulseRing, stylePulseRing]} />

        {/* Fichas cósmicas flotantes y en rotación continua */}
        <Animated.Text style={[styles.bgDecorBigX, styleX1]}>X</Animated.Text>
        <Animated.Text style={[styles.bgDecorBigO, styleO1]}>O</Animated.Text>
        <Animated.Text style={[styles.bgDecorMidO, styleO2]}>O</Animated.Text>
        <Animated.Text style={[styles.bgDecorMidX, styleX2]}>X</Animated.Text>
        <Animated.Text style={[styles.bgDecorSmallY, styleY]}>Y</Animated.Text>
      </View>

      <View style={styles.content}>
        {/* Cabecera / Título */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleBadge, { color: Colors.playerX }]}>X</Text>
            <Text style={styles.title}>TRES EN RAYA</Text>
            <Text style={[styles.titleBadge, { color: Colors.playerO }]}>O</Text>
          </View>
          <Text style={styles.subtitle}>
            El clásico llevado a nuevas dimensiones.
          </Text>
        </View>

        {/* Menú de Botones */}
        <View style={styles.menuContainer}>
          <GameButton
            title="JUGAR"
            size="large"
            variant="accent"
            onPress={() => navigation.navigate('BoardSelect')}
          />

          <GameButton
            title="MODO CAMPAÑA"
            size="medium"
            variant="primary"
            onPress={() => navigation.navigate('Campaign')}
          />

          <GameButton
            title="DESAFÍOS Y PUZZLES"
            size="medium"
            variant="secondary"
            onPress={() => navigation.navigate('Puzzle')}
          />

          <GameButton
            title="MODO LABORATORIO"
            size="medium"
            variant="secondary"
            onPress={() => navigation.navigate('Lab')}
          />

          <GameButton
            title="ESTADÍSTICAS"
            size="medium"
            onPress={() => navigation.navigate('Statistics')}
          />

          <GameButton
            title="CONFIGURACIÓN"
            size="medium"
            onPress={() => navigation.navigate('Settings')}
          />

          <GameButton
            title="ACERCA DE"
            size="medium"
            variant="secondary"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        {/* Pie de página */}
        <Text style={styles.footerText}>
          C++17 & SFML Port • Android & iOS Ready
        </Text>
      </View>

      {/* Modal de confirmación para salir del juego */}
      <ExitConfirmModal
        visible={exitModalVisible}
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => BackHandler.exitApp()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  animatedBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 24,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadge: {
    fontSize: 36,
    fontWeight: '900',
    marginHorizontal: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    marginVertical: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  // Fondos y decoraciones animadas
  bgGlowCyan: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.accentCyan,
  },
  bgGlowPink: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accentPink,
  },
  bgPulseRing: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    width: 280,
    height: 280,
    marginLeft: -140,
    marginTop: -140,
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.4)',
  },
  bgDecorBigX: {
    position: 'absolute',
    top: 60,
    left: 10,
    fontSize: 110,
    fontWeight: '900',
    color: Colors.playerX,
    opacity: 0.08,
  },
  bgDecorBigO: {
    position: 'absolute',
    bottom: 90,
    right: 10,
    fontSize: 130,
    fontWeight: '900',
    color: Colors.playerO,
    opacity: 0.08,
  },
  bgDecorMidO: {
    position: 'absolute',
    top: 140,
    right: 24,
    fontSize: 64,
    fontWeight: '900',
    color: Colors.playerO,
    opacity: 0.07,
  },
  bgDecorMidX: {
    position: 'absolute',
    bottom: 220,
    left: 20,
    fontSize: 58,
    fontWeight: '900',
    color: Colors.playerX,
    opacity: 0.07,
  },
  bgDecorSmallY: {
    position: 'absolute',
    top: '48%',
    right: 32,
    fontSize: 44,
    fontWeight: '900',
    color: Colors.playerY,
    opacity: 0.06,
  },
});
