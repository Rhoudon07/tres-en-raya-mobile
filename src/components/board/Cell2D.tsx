import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, View } from 'react-native';
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
  isExpiring?: boolean;
  isSelected?: boolean;
  isDestination?: boolean;
  isSelectable?: boolean;
  isGhost?: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  disableAnimation?: boolean;
}

export const Cell2D: React.FC<Cell2DProps> = ({
  symbol,
  row,
  col,
  size,
  isWinningCell = false,
  isSuggested = false,
  isExpiring = false,
  isSelected = false,
  isDestination = false,
  isSelectable = false,
  isGhost = false,
  onPress,
  disabled = false,
  style,
  disableAnimation = false,
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
    if (symbol === '#') {
      return `Casilla bloqueada por obstáculo`;
    }
    if (symbol === ' ') {
      return `Casilla fila ${row + 1}, columna ${col + 1}, vacía`;
    }
    return `Casilla fila ${row + 1}, columna ${col + 1}, ocupada por ${symbol}${
      isExpiring ? ', próxima a desaparecer' : ''
    }${isSelected ? ', seleccionada para mover' : ''}`;
  };

  const tokenColor =
    symbol === 'X'
      ? Colors.playerX
      : symbol === 'O'
      ? Colors.playerO
      : symbol === 'Y'
      ? Colors.playerY
      : '#94a3b8';
  const canPress = !disabled && symbol !== '#' && (symbol === ' ' || isSelectable || isSelected);

  return (
    <Pressable
      onPress={onPress}
      disabled={!canPress}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: symbol === '#'
            ? '#1e293b'
            : isSelected
            ? 'rgba(245, 158, 11, 0.15)'
            : isDestination
            ? 'rgba(6, 182, 212, 0.12)'
            : pressed && (symbol === ' ' || isSelectable)
            ? Colors.cellHover
            : Colors.cellNormal,
          borderColor: symbol === '#'
            ? '#475569'
            : isWinningCell
            ? Colors.winLine
            : isSuggested
            ? Colors.reviewBest
            : isSelected
            ? '#f59e0b'
            : isDestination
            ? Colors.accentCyan
            : isExpiring
            ? '#f59e0b'
            : Colors.cellBorder,
          borderWidth:
            isWinningCell || isSuggested || isSelected
              ? 2.5
              : isDestination || isExpiring
              ? 2
              : 1.5,
          borderStyle: isExpiring ? 'dashed' : 'solid',
        },
        isWinningCell && styles.winningCell,
        isSuggested && styles.suggestedCell,
        isExpiring && styles.expiringCell,
        isSelected && styles.selectedCell,
        isDestination && styles.destinationCell,
        style,
      ]}
    >
      {symbol !== ' ' &&
        (disableAnimation ? (
          <View style={styles.tokenContainer}>
            <Text
              style={[
                styles.tokenText,
                {
                  color: tokenColor,
                  fontSize: symbol === '#' ? size * 0.45 : size * 0.58,
                  opacity: isExpiring ? 0.75 : symbol === '#' ? 0.85 : 1,
                },
              ]}
            >
              {symbol === '#' ? '🪨' : symbol}
            </Text>
          </View>
        ) : (
          <Animated.View style={animatedTokenStyle}>
            <Text
              style={[
                styles.tokenText,
                {
                  color: tokenColor,
                  fontSize: symbol === '#' ? size * 0.45 : size * 0.58,
                  opacity: isExpiring ? 0.75 : symbol === '#' ? 0.85 : 1,
                },
              ]}
            >
              {symbol === '#' ? '🪨' : symbol}
            </Text>
          </Animated.View>
        ))}

      {/* Distintivo de ficha próxima a desaparecer */}
      {isExpiring && symbol !== ' ' && (
        <Text style={styles.expiringBadge}>⏳</Text>
      )}

      {/* Indicador de destino válido en fase de movimiento */}
      {isDestination && symbol === ' ' && (
        <Text
          style={[
            styles.destinationDot,
            {
              color: Colors.accentCyan,
              fontSize: size * 0.35,
            },
          ]}
        >
          ●
        </Text>
      )}

      {/* Previsualización fantasma en gravedad */}
      {isGhost && symbol === ' ' && !isDestination && (
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
  tokenContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    fontWeight: '900',
    textAlign: 'center',
  },
  expiringCell: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  expiringBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
    fontSize: 11,
  },
  selectedCell: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  destinationCell: {
    shadowColor: Colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  destinationDot: {
    textAlign: 'center',
    fontWeight: '900',
  },
});
