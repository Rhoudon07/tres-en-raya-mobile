import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Vector4i } from '../../types/board';
import { Colors } from '../../constants/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface DeckLayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WinningStrikeLine3DProps {
  winningLine: Vector4i[];
  containerWidth: number;
  containerHeight: number;
  deckLayouts: Record<number, DeckLayoutInfo>;
  gridSize: number;
  board3DWidth: number;
  cell3DSize: number;
  color?: string;
}

// Constantes de proyección isométrica 3D idénticas a los estilos de isometricPlane
const DEG2RAD = Math.PI / 180;
const ROT_Z = -12 * DEG2RAD;
const ROT_X = 38 * DEG2RAD;
const PERSPECTIVE_D = 900;
const COS_Z = Math.cos(ROT_Z);
const SIN_Z = Math.sin(ROT_Z);
const COS_X = Math.cos(ROT_X);
const SIN_X = Math.sin(ROT_X);

/**
 * Proyecta las coordenadas 3D de una casilla (fila r, columna c, piso z)
 * hacia las coordenadas 2D correspondientes en la pantalla dentro de spatial3DContainer.
 */
function projectCellToScreen(
  r: number,
  c: number,
  z: number,
  gridSize: number,
  board3DWidth: number,
  cell3DSize: number,
  containerWidth: number,
  deckLayout?: DeckLayoutInfo,
  fallbackDeckIndex: number = z
): { x: number; y: number } {
  const rowWidth = gridSize * cell3DSize + (gridSize - 1) * 4;
  const rowLeft = (board3DWidth - rowWidth) / 2;
  const planeHeight = 15 + gridSize * (cell3DSize + 4);

  // Valores de reserva si el layout nativo aún no ha medido
  const deckX = deckLayout?.x ?? Math.max(0, (containerWidth - board3DWidth) / 2);
  const defaultDeckStep = Math.max(120, planeHeight * 0.42);
  const deckY = deckLayout?.y ?? (10 + fallbackDeckIndex * defaultDeckStep);
  const planeW = deckLayout?.width ?? board3DWidth;
  const planeH = deckLayout?.height ?? planeHeight;

  const planeCenterX = deckX + planeW / 2;
  const planeCenterY = deckY + planeH / 2;

  // Centro de la casilla dentro del plano sin rotar (coordenadas locales)
  const cellLocalX = rowLeft + c * (cell3DSize + 4) + cell3DSize / 2;
  const cellLocalY = 7.5 + 2 + r * (cell3DSize + 4) + cell3DSize / 2;

  // Offset relativo al centro del plano acrílico (origen de rotación)
  const x0 = cellLocalX - planeW / 2;
  const y0 = cellLocalY - planeH / 2;

  // 1. Rotación Z (-12 deg)
  const x1 = x0 * COS_Z - y0 * SIN_Z;
  const y1 = x0 * SIN_Z + y0 * COS_Z;

  // 2. Rotación X (38 deg)
  const x2 = x1;
  const y2 = y1 * COS_X;
  const z2 = y1 * SIN_X;

  // 3. Proyección de perspectiva (d = 900)
  const w = Math.max(0.2, 1 - z2 / PERSPECTIVE_D);
  const xProj = x2 / w;
  const yProj = y2 / w;

  return {
    x: planeCenterX + xProj,
    y: planeCenterY + yProj,
  };
}

export const WinningStrikeLine3D: React.FC<WinningStrikeLine3DProps> = ({
  winningLine,
  containerWidth,
  containerHeight,
  deckLayouts,
  gridSize,
  board3DWidth,
  cell3DSize,
  color = Colors.winLine,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      useNativeDriver: false,
    }).start();
  }, [winningLine]);

  if (!winningLine || winningLine.length < 2) return null;

  // Calcular las coordenadas proyectadas de cada casilla en la línea ganadora
  const projectedPts = winningLine.map((p, idx) =>
    projectCellToScreen(
      p.x,
      p.y,
      p.z,
      gridSize,
      board3DWidth,
      cell3DSize,
      containerWidth,
      deckLayouts[p.z],
      p.z
    )
  );

  // Calcular la extensión en los extremos para un trazado limpio y dinámico
  const p0 = projectedPts[0];
  const p1 = projectedPts[1] || p0;
  const pLast = projectedPts[projectedPts.length - 1];
  const pPrevLast = projectedPts[projectedPts.length - 2] || p0;

  const ext = Math.min(22, cell3DSize * 0.28);

  const dxStart = p1.x - p0.x;
  const dyStart = p1.y - p0.y;
  const lenStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);
  const startPt =
    lenStart > 0
      ? { x: p0.x - (dxStart / lenStart) * ext, y: p0.y - (dyStart / lenStart) * ext }
      : p0;

  const dxEnd = pLast.x - pPrevLast.x;
  const dyEnd = pLast.y - pPrevLast.y;
  const lenEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);
  const endPt =
    lenEnd > 0
      ? { x: pLast.x + (dxEnd / lenEnd) * ext, y: pLast.y + (dyEnd / lenEnd) * ext }
      : pLast;

  // Generar la cadena SVG de recorrido y longitud total acumulada
  const allPoints = [startPt, ...projectedPts, endPt];
  let pathD = `M ${allPoints[0].x.toFixed(2)} ${allPoints[0].y.toFixed(2)}`;
  let totalLength = 0;

  for (let i = 1; i < allPoints.length; i++) {
    pathD += ` L ${allPoints[i].x.toFixed(2)} ${allPoints[i].y.toFixed(2)}`;
    const dX = allPoints[i].x - allPoints[i - 1].x;
    const dY = allPoints[i].y - allPoints[i - 1].y;
    totalLength += Math.sqrt(dX * dX + dY * dY);
  }

  if (totalLength <= 0) return null;

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [totalLength, 0],
  });

  const svgW = Math.max(containerWidth, board3DWidth);
  const svgH = Math.max(containerHeight, 400);

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay3D]} pointerEvents="none">
      <Svg width={svgW} height={svgH}>
        <Defs>
          <LinearGradient id="winGlow3DGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
            <Stop offset="50%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* 1. Halo difuso exterior (resplandor de la línea en el espacio 3D) */}
        <AnimatedPath
          d={pathD}
          stroke="rgba(250, 204, 21, 0.3)"
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[totalLength, totalLength]}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 2. Resplandor intermedio vibrante */}
        <AnimatedPath
          d={pathD}
          stroke="rgba(250, 204, 21, 0.7)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[totalLength, totalLength]}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 3. Haz de luz láser principal con gradiente dorado */}
        <AnimatedPath
          d={pathD}
          stroke="url(#winGlow3DGrad)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[totalLength, totalLength]}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 4. Núcleo blanco brillante de alta energía */}
        <AnimatedPath
          d={pathD}
          stroke="#ffffff"
          strokeWidth={1.5}
          strokeOpacity={0.95}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[totalLength, totalLength]}
          strokeDashoffset={strokeDashoffset}
        />

        {/* 5. Nodos y anillos holográficos en cada casilla ganadora atravesada */}
        {projectedPts.map((pt, idx) => (
          <React.Fragment key={`node-3d-${idx}`}>
            {/* Halo exterior del nodo */}
            <Circle cx={pt.x} cy={pt.y} r={12} fill="rgba(250, 204, 21, 0.25)" />
            {/* Anillo dorado medio con borde blanco */}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={6.5}
              fill="#facc15"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            {/* Núcleo central blanco */}
            <Circle cx={pt.x} cy={pt.y} r={2.5} fill="#ffffff" />
          </React.Fragment>
        ))}

        {/* 6. Puntos terminales de brillo en los extremos extendidos */}
        <Circle cx={startPt.x} cy={startPt.y} r={5} fill="#fef08a" />
        <Circle cx={endPt.x} cy={endPt.y} r={5} fill="#facc15" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay3D: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 99,
  },
});
