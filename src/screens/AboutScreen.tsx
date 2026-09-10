import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { GameCard } from '../components/common/GameCard';
import { GameButton } from '../components/common/GameButton';
import { Badge } from '../components/common/Badge';

interface AboutScreenProps {
  navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>ACERCA DEL JUEGO</Text>
          <Text style={styles.subtitle}>Tres en Raya: Dimensiones Cuánticas</Text>
        </View>

        {/* Tarjeta de Introducción */}
        <GameCard style={styles.card}>
          <Text style={styles.cardTitle}>ORIGEN & CONCEPTO</Text>
          <Text style={styles.paragraph}>
            Esta aplicación móvil es un port exhaustivo y de alta fidelidad del proyecto original de escritorio
            desarrollado en <Text style={styles.highlight}>C++17 y SFML</Text>.
          </Text>
          <Text style={styles.paragraph}>
            No es un simple Tres en Raya básico: es un motor hiperdimensional completo que incluye visualización 3D (Qubic),
            el hipercubo 4D (Teseracto de 81 celdas), física de gravedad y un sofisticado motor de Inteligencia Artificial Minimax con evaluación didáctica de partidas.
          </Text>
        </GameCard>

        {/* Las 5 Modalidades */}
        <Text style={styles.sectionHeader}>ESPECIFICACIONES MATEMÁTICAS</Text>

        <GameCard style={styles.card}>
          <View style={styles.modeRow}>
            <Text style={styles.modeName}>3x3 CLÁSICO</Text>
            <Badge label="8 Líneas" color={Colors.accentCyan} />
          </View>
          <Text style={styles.modeDesc}>
            El espacio tradicional bidimensional de 9 casillas. IA imbatible con poda Alfa-Beta y libro de aperturas.
          </Text>
        </GameCard>

        <GameCard style={styles.card}>
          <View style={styles.modeRow}>
            <Text style={styles.modeName}>3x3x3 3D (QUBIC)</Text>
            <Badge label="49 Líneas" color={Colors.playerO} />
          </View>
          <Text style={styles.modeDesc}>
            27 casillas distribuidas en 3 pisos isométricos. Cuenta con 27 líneas axiales 1D, 18 diagonales de plano 2D y 4 diagonales espaciales 3D que cruzan el centro (1,1,1).
          </Text>
        </GameCard>

        <GameCard style={styles.card}>
          <View style={styles.modeRow}>
            <Text style={styles.modeName}>3x3x3x3 4D (TESERACTO)</Text>
            <Badge label="272 Líneas" color="#a855f7" />
          </View>
          <Text style={styles.modeDesc}>
            81 casillas en una Macro-Matriz de 3 Universos W × 3 Pisos Z. Cuenta con 108 axiales, 108 diagonales planares, 48 espaciales y 8 hiperdiagonales que atraviesan el hipercentro (1,1,1,1).
          </Text>
        </GameCard>

        <GameCard style={styles.card}>
          <View style={styles.modeRow}>
            <Text style={styles.modeName}>4x4 LIBRE</Text>
            <Badge label="10 Líneas" color={Colors.accentGreen} />
          </View>
          <Text style={styles.modeDesc}>
            16 casillas con colocación libre. Cuatro fichas consecutivas necesarias para ganar y búsqueda acotada con evaluación territorial del centro.
          </Text>
        </GameCard>

        <GameCard style={styles.card}>
          <View style={styles.modeRow}>
            <Text style={styles.modeName}>4x4 GRAVEDAD (CONECTA 4)</Text>
            <Badge label="10 Líneas" color={Colors.winLine} />
          </View>
          <Text style={styles.modeDesc}>
            Física de caída por columnas hasta la fila libre más baja con animación de rebote (ease-out bounce) y búsqueda Minimax a profundidad 6 con ordenación óptima [1, 2, 0, 3].
          </Text>
        </GameCard>

        {/* Game Review */}
        <GameCard style={styles.card}>
          <Text style={styles.cardTitle}>GAME REVIEW (ANÁLISIS DE PARTIDA)</Text>
          <Text style={styles.paragraph}>
            El sistema de análisis reproduce cada partida jugada y somete cada turno a la IA para clasificarlo en:
          </Text>
          <Text style={[styles.bullet, { color: Colors.reviewBest }]}>• 🎯 Mejor jugada (100% precisión)</Text>
          <Text style={[styles.bullet, { color: Colors.reviewGood }]}>• 👍 Buena jugada (80% precisión)</Text>
          <Text style={[styles.bullet, { color: Colors.reviewInaccuracy }]}>• ⚠️ Imprecisión (50% precisión)</Text>
          <Text style={[styles.bullet, { color: Colors.reviewMistake }]}>• ❌ Error táctico (25% precisión)</Text>
          <Text style={[styles.bullet, { color: Colors.reviewBlunder }]}>• 💀 Pifia grave (0% precisión)</Text>
          <Text style={styles.paragraph}>
            Además, resalta la casilla óptima recomendada en verde esmeralda (#00E676) y calcula la precisión táctica global para X y O.
          </Text>
        </GameCard>

        {/* Créditos */}
        <GameCard style={styles.card}>
          <Text style={styles.cardTitle}>CRÉDITOS</Text>
          <Text style={styles.paragraph}>
            Basado en el proyecto original C++17 de <Text style={styles.highlight}>Rhoudon07</Text>.
          </Text>
          <Text style={styles.paragraph}>
            Tecnologías: React Native, Expo SDK 52, TypeScript, Zustand, Reanimated y Expo Haptics/AV.
          </Text>
        </GameCard>

        <GameButton
          title="VOLVER"
          variant="outline"
          size="medium"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
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
    color: Colors.accentCyan,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    marginVertical: 6,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentCyan,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 22,
    marginLeft: 8,
  },
  highlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modeName: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modeDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  backBtn: {
    marginTop: 16,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
});
