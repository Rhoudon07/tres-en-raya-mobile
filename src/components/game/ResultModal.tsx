import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { CellSymbol } from '../../types/board';
import { GameButton } from '../common/GameButton';
import { Trophy, XCircle, MinusCircle, Star } from 'lucide-react-native';

interface ResultModalProps {
  visible: boolean;
  resultMessage: string;
  winner: CellSymbol | 'D';
  campaignStars?: number;
  onPlayAgain: () => void;
  onAnalyze: () => void;
  onReturnToMenu: () => void;
  onReturnToCampaign?: () => void;
}

export { formatResultMessage } from '../../utils/resultMessageHelper';
import { formatResultMessage } from '../../utils/resultMessageHelper';

export const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  resultMessage,
  winner,
  campaignStars,
  onPlayAgain,
  onAnalyze,
  onReturnToMenu,
  onReturnToCampaign,
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

  const isDefeat = resultMessage.includes('Derrota') || resultMessage.toLowerCase().includes('cpu');

  const getHeaderColor = () => {
    if (isDefeat) return Colors.playerO;
    if (winner === 'X') return Colors.playerX;
    if (winner === 'O') return Colors.playerO;
    if (winner === 'Y') return Colors.playerY;
    if (winner === 'D') return Colors.winLine;
    return Colors.textPrimary;
  };

  const displayMessage = formatResultMessage(resultMessage, winner);

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]} pointerEvents="auto">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.headerIconContainer}>
            {winner === 'D' ? (
              <MinusCircle size={38} color={Colors.winLine} />
            ) : isDefeat ? (
              <XCircle size={38} color={Colors.playerO} />
            ) : (
              <Trophy size={38} color={getHeaderColor()} />
            )}
          </View>

          <Text style={[styles.title, { color: getHeaderColor() }]}>
            {winner === 'D' ? 'EMPATE' : isDefeat ? 'DERROTA' : '¡VICTORIA!'}
          </Text>

          <Text style={styles.message}>{displayMessage}</Text>

          {campaignStars !== undefined && (
            <View style={styles.campaignStarsRow}>
              {[1, 2, 3].map((star) => (
                <View key={star} style={{ marginHorizontal: 4 }}>
                  <Star
                    size={22}
                    color={star <= campaignStars ? '#f59e0b' : '#334155'}
                    fill={star <= campaignStars ? '#f59e0b' : 'transparent'}
                  />
                </View>
              ))}
              <Text style={styles.campaignStarsLabel}>
                {campaignStars} de 3 Estrellas
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {onReturnToCampaign && (
              <GameButton
                title="VOLVER A LA CAMPAÑA"
                variant="accent"
                size="medium"
                onPress={onReturnToCampaign}
              />
            )}

            <GameButton
              title="JUGAR OTRA VEZ"
              variant={onReturnToCampaign ? 'secondary' : 'accent'}
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
  headerIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 8,
  },
  analyzeBtn: {
    borderColor: Colors.reviewBest,
    backgroundColor: '#162e24',
  },
  campaignStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  campaignStarIcon: {
    fontSize: 22,
    color: Colors.boardBorder,
    marginHorizontal: 3,
  },
  campaignStarFilled: {
    color: '#fbbf24',
  },
  campaignStarsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginLeft: 8,
  },
});
