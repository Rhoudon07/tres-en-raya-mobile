import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { BoardModel } from '../../game/board/BoardModel';
import { BoardType, Vector4i, areVectorsEqual } from '../../types/board';
import { Colors } from '../../constants/colors';
import { Cell2D } from './Cell2D';
import { Box, Layers } from 'lucide-react-native';
import { WinningStrikeLine } from './WinningStrikeLine';
import { WinningStrikeLine3D, DeckLayoutInfo } from './WinningStrikeLine3D';

interface Board3DProps {
  board: BoardModel;
  onCellPress: (pos: Vector4i) => void;
  winningLine?: Vector4i[] | null;
  suggestedCell?: Vector4i | null;
  disabled?: boolean;
}

export const Board3D: React.FC<Board3DProps> = ({
  board,
  onCellPress,
  winningLine,
  suggestedCell,
  disabled = false,
}) => {
  const { width } = useWindowDimensions();
  const [viewMode, setViewMode] = useState<'3d' | 'layers'>('3d');
  const [selectedZ, setSelectedZ] = useState<number>(1);
  const [lastSelectedCoord, setLastSelectedCoord] = useState<Vector4i | null>(null);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [deckLayouts, setDeckLayouts] = useState<Record<number, DeckLayoutInfo>>({});

  const deckWrapperLayouts = useRef<Record<number, { x: number; y: number }>>({});
  const planeLayouts = useRef<Record<number, { x: number; y: number; width: number; height: number }>>({});

  const updateDeckLayout = (z: number) => {
    const wrapper = deckWrapperLayouts.current[z];
    const plane = planeLayouts.current[z];
    if (wrapper && plane) {
      setDeckLayouts((prev) => ({
        ...prev,
        [z]: {
          x: wrapper.x + plane.x,
          y: wrapper.y + plane.y,
          width: plane.width,
          height: plane.height,
        },
      }));
    }
  };

  const gridSize = board.gridSize;
  const layersCount = board.type === BoardType.TicTacToe4x4_3D ? 4 : 3;

  const floorLabels =
    layersCount === 4
      ? ['PISO 1', 'PISO 2', 'PISO 3', 'PISO 4']
      : ['PISO 1 (SUPERIOR)', 'PISO 2 (MEDIO)', 'PISO 3 (INFERIOR)'];

  const hasWinOnFloor = (z: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.z === z);
  };

  const hasSuggestionOnFloor = (z: number): boolean => {
    if (!suggestedCell) return false;
    return suggestedCell.z === z;
  };

  const isWinningCell = (r: number, c: number, z: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.x === r && p.y === c && p.z === z);
  };

  const isSuggested = (r: number, c: number, z: number): boolean => {
    if (!suggestedCell) return false;
    return areVectorsEqual({ x: r, y: c, z, w: 0 }, suggestedCell);
  };

  const handleCellPress = (r: number, c: number, z: number) => {
    const pos: Vector4i = { x: r, y: c, z, w: 0 };
    setLastSelectedCoord(pos);
    onCellPress(pos);
  };

  // Dimensiones para vista detallada 2D
  const maxBoardWidth2D = Math.min(width - 32, 380);
  const gap2D = gridSize === 4 ? 8 : 10;
  const cellSize2D = Math.floor((maxBoardWidth2D - (gridSize + 1) * gap2D) / gridSize);

  // Dimensiones para vista isométrica 3D
  const board3DWidth = Math.min(width - 40, 310);
  const cell3DSize = Math.floor((board3DWidth - (gridSize + 1) * 6) / gridSize);

  return (
    <View style={styles.wrapper}>
      {/* Selector de modo de vista: 3D Espacial vs Detalle por Pisos */}
      <View style={styles.viewToggleRow}>
        <Pressable
          style={[styles.toggleBtn, viewMode === '3d' && styles.toggleBtnActive]}
          onPress={() => setViewMode('3d')}
        >
          <Box size={14} color={viewMode === '3d' ? Colors.accentCyan : Colors.textMuted} />
          <Text style={[styles.toggleText, viewMode === '3d' && styles.toggleTextActive]}>
            PERSPECTIVA 3D
          </Text>
        </Pressable>

        <Pressable
          style={[styles.toggleBtn, viewMode === 'layers' && styles.toggleBtnActive]}
          onPress={() => setViewMode('layers')}
        >
          <Layers size={14} color={viewMode === 'layers' ? Colors.accentCyan : Colors.textMuted} />
          <Text style={[styles.toggleText, viewMode === 'layers' && styles.toggleTextActive]}>
            VISTA POR PISOS
          </Text>
        </Pressable>
      </View>

      {/* Telemetría de coordenadas activas */}
      <View style={styles.telemetryBar}>
        <Text style={styles.telemetryText}>
          {lastSelectedCoord
            ? `Última selección: Fila ${lastSelectedCoord.x + 1}, Col ${lastSelectedCoord.y + 1}, Piso ${lastSelectedCoord.z + 1}`
            : viewMode === '3d'
            ? 'Toca cualquier casilla directamente sobre los 3 pisos'
            : `Viendo: ${floorLabels[selectedZ]}`}
        </Text>
      </View>

      {viewMode === '3d' ? (
        /* VISTA TRIDIMENSIONAL ESPACIAL: 3 capas apiladas con perspectiva isométrica */
        <View
          style={styles.spatial3DContainer}
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            if (w > 0 && h > 0) {
              setContainerSize({ width: w, height: h });
            }
          }}
        >
          {Array.from({ length: layersCount }).map((_, zIndex) => {
            // zIndex 0 = Piso 1 (arriba), zIndex 1 = Piso 2, zIndex 2 = Piso 3
            const z = zIndex;
            const hasWin = hasWinOnFloor(z);

            return (
              <View
                key={`deck-${z}`}
                onLayout={(e) => {
                  const { x, y } = e.nativeEvent.layout;
                  deckWrapperLayouts.current[z] = { x, y };
                  updateDeckLayout(z);
                }}
                style={[
                  styles.isometricDeckWrapper,
                  zIndex > 0 && styles.isometricDeckSubsequent,
                  { zIndex: (layersCount - zIndex) * 10 },
                ]}
              >
                {/* Etiqueta del piso con badge de victoria si aplica */}
                <View style={styles.deckHeader}>
                  <View style={styles.deckBadge}>
                    <Text style={styles.deckBadgeText}>PISO {z + 1}</Text>
                  </View>
                  {hasWin && (
                    <View style={styles.winDeckGlow}>
                      <Text style={styles.winDeckText}>¡LÍNEA GANADORA EN ESTE PISO!</Text>
                    </View>
                  )}
                </View>

                {/* Placa acrílica isométrica con casillas interactivas */}
                <View
                  onLayout={(e) => {
                    const { x, y, width: w, height: h } = e.nativeEvent.layout;
                    planeLayouts.current[z] = { x, y, width: w, height: h };
                    updateDeckLayout(z);
                  }}
                  style={[
                    styles.isometricPlane,
                    { width: board3DWidth },
                    hasWin && styles.isometricPlaneWin,
                  ]}
                >
                  {Array.from({ length: gridSize }).map((_, r) => (
                    <View key={`r3d-${r}-${z}`} style={styles.isometricRow}>
                      {Array.from({ length: gridSize }).map((_, c) => {
                        const symbol = board.getCell3D(r, c, z);
                        const win = isWinningCell(r, c, z);
                        const sug = isSuggested(r, c, z);

                        return (
                          <Cell2D
                            key={`c3d-${r}-${c}-${z}`}
                            row={r}
                            col={c}
                            size={cell3DSize}
                            symbol={symbol}
                            isWinningCell={win}
                            isSuggested={sug}
                            disabled={disabled}
                            disableAnimation={true}
                            onPress={() => handleCellPress(r, c, z)}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {/* Trazado holográfico de la línea ganadora en la perspectiva 3D (para victorias en el mismo piso o cruzando pisos) */}
          {winningLine && winningLine.length >= 3 && (
            <WinningStrikeLine3D
              winningLine={winningLine}
              containerWidth={containerSize.width || board3DWidth + 40}
              containerHeight={containerSize.height || 550}
              deckLayouts={deckLayouts}
              gridSize={gridSize}
              board3DWidth={board3DWidth}
              cell3DSize={cell3DSize}
              color={Colors.winLine}
            />
          )}
        </View>
      ) : (
        /* VISTA DETALLADA POR CAPAS (2D) */
        <View style={{ width: maxBoardWidth2D, alignSelf: 'center' }}>
          {/* Selector de Piso Z */}
          <View style={styles.floorTabs}>
            {floorLabels.map((label, z) => {
              const isSelected = selectedZ === z;
              const hasWin = hasWinOnFloor(z);
              const hasSug = hasSuggestionOnFloor(z);

              return (
                <Pressable
                  key={`floor-${z}`}
                  onPress={() => setSelectedZ(z)}
                  style={[
                    styles.floorTab,
                    isSelected && styles.floorTabSelected,
                    hasWin && styles.floorTabWin,
                    hasSug && styles.floorTabSug,
                  ]}
                >
                  <Text
                    style={[
                      styles.floorTabText,
                      isSelected && styles.floorTabTextSelected,
                      hasWin && { color: Colors.winLine },
                      hasSug && { color: Colors.reviewBest },
                    ]}
                  >
                    PISO {z + 1}
                  </Text>
                  {hasWin && <View style={styles.winDot} />}
                  {hasSug && <View style={styles.sugDot} />}
                </Pressable>
              );
            })}
          </View>

          {/* Tablero del piso seleccionado */}
          <View style={styles.container2D}>
            {Array.from({ length: gridSize }).map((_, r) => (
              <View key={`row-${r}`} style={styles.row2D}>
                {Array.from({ length: gridSize }).map((_, c) => {
                  const symbol = board.getCell3D(r, c, selectedZ);
                  return (
                    <Cell2D
                      key={`cell-${r}-${c}-${selectedZ}`}
                      row={r}
                      col={c}
                      size={cellSize2D}
                      symbol={symbol}
                      isWinningCell={isWinningCell(r, c, selectedZ)}
                      isSuggested={isSuggested(r, c, selectedZ)}
                      disabled={disabled}
                      onPress={() => handleCellPress(r, c, selectedZ)}
                    />
                  );
                })}
              </View>
            ))}

            {winningLine &&
              winningLine.length >= 3 &&
              winningLine.every((p) => p.z === selectedZ) && (
                <WinningStrikeLine
                  winningLine={winningLine}
                  boardWidth={maxBoardWidth2D}
                  gridSize={gridSize}
                  cellSize={cellSize2D}
                  padding={10}
                  gap={8}
                />
              )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#121622',
    borderColor: '#1e2638',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#1b2438',
    borderColor: Colors.accentCyan,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: Colors.accentCyan,
  },
  telemetryBar: {
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#121622',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e2433',
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  spatial3DContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
    position: 'relative',
  },
  isometricDeckWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  isometricDeckSubsequent: {
    marginTop: -32,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 275,
    marginBottom: 2,
  },
  deckBadge: {
    backgroundColor: '#1b2438',
    borderColor: '#2e3d5b',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deckBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.accentCyan,
    letterSpacing: 0.8,
  },
  winDeckGlow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: Colors.winLine,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  winDeckText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.winLine,
  },
  isometricPlane: {
    backgroundColor: 'rgba(20, 26, 38, 0.95)',
    borderColor: '#2d3b55',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 6,
    transform: [
      { perspective: 900 },
      { rotateX: '38deg' },
      { rotateZ: '-12deg' },
    ],
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  isometricPlaneWin: {
    borderColor: Colors.winLine,
    shadowColor: Colors.winLine,
    shadowOpacity: 0.5,
  },
  isometricRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 2,
  },
  floorTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  floorTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.boardSurface,
    borderRadius: 10,
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    position: 'relative',
  },
  floorTabSelected: {
    borderColor: Colors.accentCyan,
    backgroundColor: '#1b2438',
  },
  floorTabWin: {
    borderColor: Colors.winLine,
  },
  floorTabSug: {
    borderColor: Colors.reviewBest,
  },
  floorTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  floorTabTextSelected: {
    color: Colors.accentCyan,
  },
  winDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.winLine,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  sugDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.reviewBest,
    position: 'absolute',
    top: 4,
    left: 4,
  },
  container2D: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 2,
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
  },
  row2D: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
});
