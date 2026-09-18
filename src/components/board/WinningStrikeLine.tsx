import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import Svg, { Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Vector4i } from '../../types/board';
import { Colors } from '../../constants/colors';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WinningStrikeLineProps {
  winningLine: Vector4i[];
  boardWidth: number;
  boardHeight?: number;
  gridSize: number;
  cellSize: number;
  padding?: number;
  gap?: number;
  color?: string;
}

export const WinningStrikeLine: React.FC<WinningStrikeLineProps> = ({
  winningLine,
  boardWidth,
  boardHeight,
  gridSize,
  cellSize,
  padding = 10,
  gap,
  color = Colors.winLine,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const height = boardHeight || boardWidth;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [winningLine]);

  if (!winningLine || winningLine.length < 2) return null;

  // Si no se especifica el gap exacto, calcularlo según el ancho y padding
  const computedGap =
    gap !== undefined
      ? gap
      : (boardWidth - padding * 2 - cellSize * gridSize) / Math.max(1, gridSize - 1);

  const pStart = winningLine[0];
  const pEnd = winningLine[winningLine.length - 1];

  // Coordenadas del centro de la primera y última casilla ganadora
  const x1 = padding + pStart.y * (cellSize + computedGap) + cellSize / 2;
  const y1 = padding + pStart.x * (cellSize + computedGap) + cellSize / 2;
  const x2 = padding + pEnd.y * (cellSize + computedGap) + cellSize / 2;
  const y2 = padding + pEnd.x * (cellSize + computedGap) + cellSize / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const baseLen = Math.sqrt(dx * dx + dy * dy);

  if (baseLen === 0) return null;

  // Extender ligeramente el trazo más allá de los centros para que cruce limpiamente las fichas
  const extension = Math.min(18, cellSize * 0.35);
  const startX = x1 - (dx / baseLen) * extension;
  const startY = y1 - (dy / baseLen) * extension;
  const endX = x2 + (dx / baseLen) * extension;
  const endY = y2 + (dy / baseLen) * extension;

  const totalLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [totalLength, 0],
  });

  const dotScale = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { width: boardWidth, height },
      ]}
      pointerEvents="none"
    >
      <Svg width={boardWidth} height={height}>
        <Defs>
          <LinearGradient id="winGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <Stop offset="50%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {/* 1. Halo difuso exterior (resplandor de la línea) */}
        <AnimatedLine
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="rgba(250, 204, 21, 0.35)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${totalLength}, ${totalLength}`}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 2. Trazo medio de luz neón */}
        <AnimatedLine
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="rgba(254, 240, 138, 0.65)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${totalLength}, ${totalLength}`}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 3. Núcleo láser brillante central */}
        <AnimatedLine
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="url(#winGlowGrad)"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={`${totalLength}, ${totalLength}`}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 4. Terminal de inicio y fin con brillo */}
        <Circle cx={startX} cy={startY} r={5} fill="#fef08a" />
        <Circle cx={endX} cy={endY} r={5} fill="#facc15" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99,
  },
});
