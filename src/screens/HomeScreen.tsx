import React, { useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { GameButton } from '../components/common/GameButton';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useStatsStore } from '../stores/useStatsStore';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadStats = useStatsStore((state) => state.loadStats);

  // Animación suave de partículas decorativas de fondo
  const floatAnim1 = useSharedValue(0);
  const floatAnim2 = useSharedValue(0);

  useEffect(() => {
    loadSettings();
    loadStats();

    floatAnim1.value = withRepeat(
      withTiming(20, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    floatAnim2.value = withRepeat(
      withTiming(-20, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const styleX = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim1.value }, { rotate: `${floatAnim1.value * 0.5}deg` }],
  }));

  const styleO = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim2.value }, { rotate: `${floatAnim2.value * -0.5}deg` }],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Decoraciones animadas de fondo */}
      <Animated.Text style={[styles.bgDecorX, styleX]}>X</Animated.Text>
      <Animated.Text style={[styles.bgDecorO, styleO]}>O</Animated.Text>

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
            title="MODALIDADES"
            size="medium"
            onPress={() => navigation.navigate('BoardSelect')}
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
            variant="outline"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        {/* Pie de página */}
        <Text style={styles.footerText}>
          C++17 & SFML Port • Android & iOS Ready
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
  bgDecorX: {
    position: 'absolute',
    top: 90,
    left: 20,
    fontSize: 120,
    fontWeight: '900',
    color: Colors.playerX,
    opacity: 0.04,
    zIndex: 1,
  },
  bgDecorO: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    fontSize: 140,
    fontWeight: '900',
    color: Colors.playerO,
    opacity: 0.04,
    zIndex: 1,
  },
});
