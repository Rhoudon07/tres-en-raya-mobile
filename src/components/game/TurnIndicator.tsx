import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { CellSymbol } from '../../types/board';

interface TurnIndicatorProps {
  currentTurn: CellSymbol;
  isCpuThinking: boolean;
  gameOver: boolean;
  resultMessage?: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentTurn,
  isCpuThinking,
  gameOver,
  resultMessage,
}) => {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (isCpuThinking) {
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isCpuThinking]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (gameOver) {
    return (
      <View style={[styles.container, styles.gameOverContainer]}>
        <Text style={styles.resultText}>{resultMessage || 'Partida Finalizada'}</Text>
      </View>
    );
  }

  const activeColor =
    currentTurn === 'X'
      ? Colors.playerX
      : currentTurn === 'O'
      ? Colors.playerO
      : currentTurn === 'Y'
      ? Colors.playerY
      : Colors.textSecondary;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.label}>
        {isCpuThinking ? 'CPU PENSANDO' : 'TURNO'}
      </Text>
      <View style={[styles.symbolBadge, { borderColor: activeColor, backgroundColor: `${activeColor}20` }]}>
        <Text style={[styles.symbolText, { color: activeColor }]}>
          {currentTurn}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#191f2c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.boardBorder,
    alignSelf: 'center',
    marginVertical: 6,
  },
  gameOverContainer: {
    borderColor: Colors.winLine,
    backgroundColor: '#26231a',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginRight: 10,
  },
  symbolBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 18,
    fontWeight: '900',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.winLine,
    letterSpacing: 0.5,
  },
});
