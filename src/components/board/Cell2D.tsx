import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { CellSymbol } from '../../types/board';

interface Cell2DProps {
  symbol: CellSymbol;
  row: number;
  col: number;
  size: number;
  isWinningCell?: boolean;
  isSuggested?: boolean;
  isGhost?: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Cell2D: React.FC<Cell2DProps> = ({
  symbol,
  row,
  col,
  size,
  isWinningCell = false,
  isSuggested = false,
  isGhost = false,
  onPress,
  disabled = false,
  style,
}) => {
  const scale = useSharedValue(symbol !== ' ' ? 1 : 0);
  const opacity = useSharedValue(symbol !== ' ' ? 1 : 0);

  useEffect(() => {
    if (symbol !== ' ') {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [symbol]);

  const animatedTokenStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getAccessibilityLabel = () => {
    if (symbol === ' ') {
      return `Casilla fila ${row + 1}, columna ${col + 1}, vacía`;
    }
    return `Casilla fila ${row + 1}, columna ${col + 1}, ocupada por ${symbol}`;
  };

  const tokenColor = symbol === 'X' ? Colors.playerX : Colors.playerO;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || symbol !== ' '}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: pressed && symbol === ' ' ? Colors.cellHover : Colors.cellNormal,
          borderColor: isWinningCell
            ? Colors.winLine
            : isSuggested
            ? Colors.reviewBest
            : Colors.cellBorder,
          borderWidth: isWinningCell || isSuggested ? 2.5 : 1.5,
        },
        isWinningCell && styles.winningCell,
        isSuggested && styles.suggestedCell,
        style,
      ]}
    >
      {symbol !== ' ' && (
        <Animated.View style={animatedTokenStyle}>
          <Text
            style={[
              styles.tokenText,
              {
                color: tokenColor,
                fontSize: size * 0.58,
              },
            ]}
          >
            {symbol}
          </Text>
        </Animated.View>
      )}

      {/* Previsualización fantasma en gravedad */}
      {isGhost && symbol === ' ' && (
        <Text
          style={[
            styles.tokenText,
            {
              color: Colors.accentCyan,
              fontSize: size * 0.58,
              opacity: 0.35,
            },
          ]}
        >
          ●
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  winningCell: {
    backgroundColor: Colors.cellHighlightWin,
    shadowColor: Colors.winLine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestedCell: {
    shadowColor: Colors.reviewBest,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  tokenText: {
    fontWeight: '900',
    textAlign: 'center',
  },
});
