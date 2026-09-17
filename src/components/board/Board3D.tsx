import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { BoardModel } from '../../game/board/BoardModel';
import { BoardType, Vector4i, areVectorsEqual } from '../../types/board';
import { Colors } from '../../constants/colors';
import { Cell2D } from './Cell2D';

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
  const [selectedZ, setSelectedZ] = useState<number>(0);
  const [lastSelectedCoord, setLastSelectedCoord] = useState<Vector4i | null>(null);

  const gridSize = board.gridSize;
  const layersCount = board.type === BoardType.TicTacToe4x4_3D ? 4 : 3;
  const maxBoardWidth = Math.min(width - 32, 380);
  const gap = gridSize === 4 ? 8 : 10;
  const paddingTotal = (gridSize + 1) * gap;
  const cellSize = Math.floor((maxBoardWidth - paddingTotal) / gridSize);

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

  return (
    <View style={[styles.wrapper, { width: maxBoardWidth }]}>
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

      {/* Indicador de Coordenadas activas */}
      <View style={styles.telemetryBar}>
        <Text style={styles.telemetryText}>
          {lastSelectedCoord
            ? `Posición: Fila ${lastSelectedCoord.x + 1}, Col ${lastSelectedCoord.y + 1}, Piso ${lastSelectedCoord.z + 1}`
            : `Viendo: ${floorLabels[selectedZ]}`}
        </Text>
      </View>

      {/* Tablero 3x3 del Piso Activo */}
      <View style={styles.container}>
        {Array.from({ length: gridSize }).map((_, r) => (
          <View key={`row-${r}`} style={styles.row}>
            {Array.from({ length: gridSize }).map((_, c) => {
              const symbol = board.getCell3D(r, c, selectedZ);
              return (
                <Cell2D
                  key={`cell-${r}-${c}-${selectedZ}`}
                  row={r}
                  col={c}
                  size={cellSize}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  floorTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  floorTab: {
    flex: 1,
    height: 38,
    marginHorizontal: 3,
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floorTabSelected: {
    borderColor: Colors.accentCyan,
    backgroundColor: '#1b2d42',
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
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  floorTabTextSelected: {
    color: Colors.accentCyan,
  },
  winDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.winLine,
  },
  sugDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.reviewBest,
  },
  telemetryBar: {
    backgroundColor: '#161c28',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  telemetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  container: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 2,
    borderRadius: 22,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
  },
});
