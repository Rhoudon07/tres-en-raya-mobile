import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { BoardModel } from '../../game/board/BoardModel';
import { Vector4i, areVectorsEqual } from '../../types/board';
import { Colors } from '../../constants/colors';
import { Cell2D } from './Cell2D';

interface BoardGravityProps {
  board: BoardModel;
  onColumnPress: (col: number) => void;
  winningLine?: Vector4i[] | null;
  suggestedCell?: Vector4i | null;
  disabled?: boolean;
}

export const BoardGravity: React.FC<BoardGravityProps> = ({
  board,
  onColumnPress,
  winningLine,
  suggestedCell,
  disabled = false,
}) => {
  const { width } = useWindowDimensions();
  const [activeCol, setActiveCol] = useState<number | null>(null);

  const gridSize = 4;
  const maxBoardWidth = Math.min(width - 32, 400);
  const paddingTotal = (gridSize + 1) * 8;
  const cellSize = Math.floor((maxBoardWidth - paddingTotal) / gridSize);

  const isWinningCell = (r: number, c: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.x === r && p.y === c && p.z === 0 && p.w === 0);
  };

  const isSuggested = (r: number, c: number): boolean => {
    if (!suggestedCell) return false;
    return areVectorsEqual({ x: r, y: c, z: 0, w: 0 }, suggestedCell);
  };

  const handleColumnPress = (c: number) => {
    if (disabled || board.isColumnFull(c)) return;
    onColumnPress(c);
  };

  return (
    <View style={[styles.wrapper, { width: maxBoardWidth }]}>
      {/* Indicadores de columna superiores */}
      <View style={styles.columnIndicatorsRow}>
        {Array.from({ length: gridSize }).map((_, c) => {
          const isFull = board.isColumnFull(c);
          const isSelected = activeCol === c;
          return (
            <Pressable
              key={`indicator-${c}`}
              disabled={disabled || isFull}
              onPress={() => handleColumnPress(c)}
              onPressIn={() => setActiveCol(c)}
              onPressOut={() => setActiveCol(null)}
              style={[
                styles.indicatorBtn,
                { width: cellSize },
                isSelected && styles.indicatorBtnActive,
                isFull && styles.indicatorBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.indicatorText,
                  isSelected && { color: Colors.accentCyan },
                  isFull && { color: Colors.textMuted },
                ]}
              >
                {isFull ? '✕' : '▼'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tablero 4x4 */}
      <View style={styles.container}>
        {Array.from({ length: gridSize }).map((_, r) => (
          <View key={`row-${r}`} style={styles.row}>
            {Array.from({ length: gridSize }).map((_, c) => {
              const symbol = board.getCell2D(r, c);
              const lowestRow = board.getLowestAvailableRow(c);
              const isGhost = activeCol === c && r === lowestRow && symbol === ' ';

              return (
                <Cell2D
                  key={`cell-${r}-${c}`}
                  row={r}
                  col={c}
                  size={cellSize}
                  symbol={symbol}
                  isGhost={isGhost}
                  isWinningCell={isWinningCell(r, c)}
                  isSuggested={isSuggested(r, c)}
                  disabled={disabled || board.isColumnFull(c)}
                  onPress={() => handleColumnPress(c)}
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
  columnIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  indicatorBtn: {
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1b2230',
    borderColor: Colors.boardBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorBtnActive: {
    borderColor: Colors.accentCyan,
    backgroundColor: '#1f334d',
  },
  indicatorBtnDisabled: {
    opacity: 0.4,
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.accentCyan,
  },
  container: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 2,
    borderRadius: 22,
    padding: 8,
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
