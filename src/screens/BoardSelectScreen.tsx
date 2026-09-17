import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { BoardType } from '../types/board';
import { useGameStore } from '../stores/useGameStore';
import { Badge } from '../components/common/Badge';
import { GameButton } from '../components/common/GameButton';
import { useDisableAndroidBack } from '../hooks/useDisableAndroidBack';

interface BoardSelectScreenProps {
  navigation: any;
}

interface BoardOption {
  type: BoardType;
  title: string;
  category: string;
  dimensions: string;
  cells: number;
  lines: string;
  description: string;
  accentColor: string;
}

const BOARDS: BoardOption[] = [
  {
    type: BoardType.TicTacToe3x3,
    title: '3x3 CLÁSICO',
    category: '2D TRADICIONAL',
    dimensions: '3 × 3',
    cells: 9,
    lines: '8 líneas ganadoras',
    description: 'El Tres en Raya legendario. Tres fichas en línea para la victoria. IA imbatible en dificultad difícil.',
    accentColor: Colors.accentCyan,
  },
  {
    type: BoardType.TicTacToe3D,
    title: '3x3x3 QUBIC (3D)',
    category: 'TRIDIMENSIONAL',
    dimensions: '3 × 3 × 3',
    cells: 27,
    lines: '49 líneas ganadoras',
    description: 'Tres pisos interactivos. Líneas axiales, diagonales en planos y 4 diagonales espaciales cruzando el centro.',
    accentColor: Colors.playerO,
  },
  {
    type: BoardType.TicTacToe4x4_3D,
    title: '4x4x4 3D (QUBIC 4x4)',
    category: 'TRIDIMENSIONAL EXTENDIDO',
    dimensions: '4 × 4 × 4',
    cells: 64,
    lines: '76 líneas ganadoras',
    description: 'Cubo de 4 pisos y 64 casillas. Cuatro en raya en cualquier dirección espacial: filas, columnas, pilares verticales, diagonales en planos y 4 diagonales espaciales.',
    accentColor: '#f59e0b',
  },
  {
    type: BoardType.TicTacToe4D,
    title: '3x3x3x3 TESERACTO (4D)',
    category: 'HIPERDIMENSIONAL',
    dimensions: '3 × 3 × 3 × 3',
    cells: 81,
    lines: '272 líneas ganadoras',
    description: 'Macro-matriz de 3 Universos W × 3 Pisos Z. Telemetría 4D en tiempo real e hiperdiagonales que atraviesan universos.',
    accentColor: '#a855f7',
  },
  {
    type: BoardType.Connect4x4,
    title: '4x4 LIBRE',
    category: 'TABLERO EXTENDIDO',
    dimensions: '4 × 4',
    cells: 16,
    lines: '10 líneas ganadoras',
    description: 'Colocación libre sin gravedad. Cuatro fichas consecutivas necesarias para ganar y fuerte control territorial del centro.',
    accentColor: Colors.accentGreen,
  },
  {
    type: BoardType.Connect5x5,
    title: '5x5 LIBRE (CINCO EN RAYA)',
    category: 'TABLERO EXTENDIDO',
    dimensions: '5 × 5',
    cells: 25,
    lines: '12 líneas ganadoras',
    description: 'Cinco en Raya en cuadrícula expandida de 25 casillas. Cinco fichas consecutivas necesarias para la victoria con alto valor táctico en el centro.',
    accentColor: '#ec4899',
  },
  {
    type: BoardType.Gravity4x4,
    title: '4x4 CON GRAVEDAD',
    category: 'ESTILO CONECTA 4',
    dimensions: '4 × 4 (Física)',
    cells: 16,
    lines: '10 líneas ganadoras',
    description: 'Las fichas caen por gravedad hasta la posición libre inferior de cada columna con animación y previsualización táctil.',
    accentColor: Colors.winLine,
  },
];

export const BoardSelectScreen: React.FC<BoardSelectScreenProps> = ({ navigation }) => {
  useDisableAndroidBack();
  const setBoardType = useGameStore((state) => state.setBoardType);

  const handleSelectBoard = (type: BoardType) => {
    setBoardType(type);
    navigation.navigate('GameMode');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>SELECCIONA MODALIDAD</Text>
          <Text style={styles.subtitle}>
            Elige la dimensión y física del tablero
          </Text>
        </View>

        <View style={styles.list}>
          {BOARDS.map((board) => (
            <Pressable
              key={board.type}
              onPress={() => handleSelectBoard(board.type)}
              style={({ pressed }) => [
                styles.card,
                { borderColor: board.accentColor },
                pressed && { backgroundColor: '#1e2638' },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardCategory, { color: board.accentColor }]}>
                    {board.category}
                  </Text>
                  <Text style={styles.cardTitle}>{board.title}</Text>
                </View>
                <Badge label={`${board.cells} CELDAS`} color={board.accentColor} />
              </View>

              <Text style={styles.cardDesc}>{board.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.footerSpec}>{board.dimensions}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={[styles.footerSpec, { color: board.accentColor }]}>{board.lines}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <GameButton
          title="VOLVER"
          variant="secondary"
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  list: {
    marginVertical: 10,
  },
  card: {
    backgroundColor: Colors.boardSurface,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 19,
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.boardBorder,
  },
  footerSpec: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dot: {
    marginHorizontal: 8,
    color: Colors.textMuted,
  },
  backBtn: {
    marginTop: 10,
    maxWidth: 360,
    alignSelf: 'center',
    width: '100%',
  },
});
