import React from 'react';
import { StyleSheet, Text, View, Modal } from 'react-native';
import { Colors } from '../../constants/colors';
import { GameButton } from '../common/GameButton';

interface ResultModalProps {
  visible: boolean;
  resultMessage: string;
  winner: 'X' | 'O' | 'D' | ' ';
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
  const getHeaderColor = () => {
    if (winner === 'X') return Colors.playerX;
    if (winner === 'O') return Colors.playerO;
    if (winner === 'D') return Colors.winLine;
    return Colors.textPrimary;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: getHeaderColor() }]}>
            {winner === 'D' ? 'EMPATE' : `¡VICTORIA!`}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
