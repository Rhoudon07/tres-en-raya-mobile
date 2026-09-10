import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { MoveAnalysis } from '../../types/review';
import { Badge } from '../common/Badge';

interface ReviewCardProps {
  currentStep: number;
  totalSteps: number;
  currentTurnSymbol: string;
  analysis?: MoveAnalysis | null;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  currentStep,
  totalSteps,
  currentTurnSymbol,
  analysis,
}) => {
  if (currentStep === 0 || !analysis) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.stepTitle}>
            Inicio de la partida (0 / {totalSteps})
          </Text>
          <Badge label="INFORMACIÓN" color={Colors.textMuted} />
        </View>
        <Text style={styles.commentary}>
          Tablero inicial vacío. Usa los controles o flechas para avanzar jugada a jugada.
        </Text>
        <Text style={styles.tip}>
          ✦ Navega cada turno para ver la evaluación táctica del motor Minimax.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.stepTitle}>
          Jugada {currentStep} de {totalSteps} (Turno {currentTurnSymbol})
        </Text>
        <Badge label={analysis.badgeText} color={analysis.badgeColor} />
      </View>

      <Text style={styles.commentary}>{analysis.commentary}</Text>
      <Text style={styles.tip}>{analysis.tip}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#19202e',
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  commentary: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  tip: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
