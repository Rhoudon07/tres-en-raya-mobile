import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { CellSymbol } from '../../types/board';
import { GameButton } from '../common/GameButton';

interface ResultModalProps {
  visible: boolean;
  resultMessage: string;
  winner: CellSymbol | 'D';
  onPlayAgain: () => void;
  onAnalyze: () => void;
  onReturnToMenu: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  resultMessage,
  winner,
  onPlayAgain,
  onAnalyze,
  onReturnToMenu,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  if (!visible) return null;

  const getHeaderColor = () => {
    if (winner === 'X') return Colors.playerX;
    if (winner === 'O') return Colors.playerO;
    if (winner === 'D') return Colors.winLine;
    return Colors.textPrimary;
  };

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]} pointerEvents="auto">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.title, { color: getHeaderColor() }]}>
            {winner === 'D' ? 'EMPATE' : '¡VICTORIA!'}
          </Text>

          <Text style={styles.message}>{resultMessage}</Text>

          <View style={styles.actions}>
            <GameButton
              title="JUGAR OTRA VEZ"
              variant="accent"
              size="medium"
              onPress={onPlayAgain}
            />

            <GameButton
              title="ANALIZAR PARTIDA"
              variant="primary"
              size="medium"
              style={styles.analyzeBtn}
              textStyle={{ color: Colors.reviewBest }}
              onPress={onAnalyze}
            />

            <GameButton
              title="MENÚ PRINCIPAL"
              variant="secondary"
              size="medium"
              onPress={onReturnToMenu}
            />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.modalSurface,
    borderColor: Colors.modalBorder,
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
  analyzeBtn: {
    borderColor: Colors.reviewBest,
    backgroundColor: '#162e24',
  },
});
