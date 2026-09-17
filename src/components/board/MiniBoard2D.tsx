import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { BoardModel } from '../../game/board/BoardModel';
import { CellSymbol, Vector4i, areVectorsEqual } from '../../types/board';
import { Colors } from '../../constants/colors';
import { Cell2D } from './Cell2D';

interface MiniBoard2DProps {
  macroIdx: number;
  board: BoardModel;
  miniSize: number;
  isActive: boolean;
  isWon: CellSymbol | 'D';
  winningLine?: Vector4i[] | null;
  suggestedCell?: Vector4i | null;
  onCellPress: (pos: Vector4i) => void;
  disabled?: boolean;
}

export const MiniBoard2D: React.FC<MiniBoard2DProps> = ({
  macroIdx,
  board,
  miniSize,
  isActive,
  isWon,
  winningLine,
  suggestedCell,
  onCellPress,
  disabled = false,
}) => {
  const w = Math.floor(macroIdx / 3);
  const z = macroIdx % 3;
  const cellSize = Math.floor((miniSize - 16) / 3);

  const isMiniWinningCell = (r: number, c: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.x === r && p.y === c && p.z === z && p.w === w);
  };

  const isCellSuggested = (r: number, c: number): boolean => {
    if (!suggestedCell) return false;
    return areVectorsEqual({ x: r, y: c, z, w }, suggestedCell);
  };

  const isBoardClosed = isWon !== ' ';

  return (
    <View
      style={[
        styles.miniContainer,
        { width: miniSize, height: miniSize },
        isActive && !isBoardClosed && styles.activeMiniBorder,
        !isActive && !isBoardClosed && board.activeMacro !== null && styles.dimmedMini,
        isBoardClosed && styles.closedMini,
      ]}
    >
      {/* Cuadrícula 3x3 de casillas micro */}
      {Array.from({ length: 3 }).map((_, r) => (
        <View key={`mini-${macroIdx}-row-${r}`} style={styles.miniRow}>
          {Array.from({ length: 3 }).map((_, c) => {
            const cellPos: Vector4i = { x: r, y: c, z, w };
            const symbol = board.getCell(cellPos);
            const isMoveLegal = board.isMoveValid(cellPos);

            return (
              <Cell2D
                key={`mini-${macroIdx}-cell-${r}-${c}`}
                row={r}
                col={c}
                size={cellSize}
                symbol={symbol}
                isWinningCell={isMiniWinningCell(r, c)}
                isSuggested={isCellSuggested(r, c)}
                disabled={disabled || isBoardClosed || !isMoveLegal}
                onPress={() => onCellPress(cellPos)}
                style={styles.microCell}
              />
            );
          })}
        </View>
      ))}

      {/* Superposición cuando el mini-tablero ya fue ganado o empatado */}
      {isBoardClosed && (
        <Animated.View
          entering={ZoomIn.duration(260)}
          style={[
            styles.wonOverlay,
            isWon === 'X' && styles.overlayX,
            isWon === 'O' && styles.overlayO,
            isWon === 'D' && styles.overlayDraw,
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.wonSymbolText,
              {
                color:
                  isWon === 'X'
                    ? Colors.playerX
                    : isWon === 'O'
                    ? Colors.playerO
                    : '#94a3b8',
                fontSize: miniSize * 0.58,
              },
            ]}
          >
            {isWon === 'D' ? '—' : isWon}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  miniContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 3,
    margin: 3,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeMiniBorder: {
    borderColor: '#38bdf8',
    borderWidth: 2.5,
    backgroundColor: '#13213c',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },
  dimmedMini: {
    opacity: 0.5,
  },
  closedMini: {
    borderColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  miniRow: {
    flexDirection: 'row',
  },
  microCell: {
    margin: 1.5,
    borderRadius: 6,
  },
  wonOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 10,
  },
  overlayX: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 2,
    borderColor: Colors.playerX,
  },
  overlayO: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 2,
    borderColor: Colors.playerO,
  },
  overlayDraw: {
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    borderWidth: 1.5,
    borderColor: '#64748b',
  },
  wonSymbolText: {
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
