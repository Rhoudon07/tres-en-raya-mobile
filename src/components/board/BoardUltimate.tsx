import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { BoardModel } from '../../game/board/BoardModel';
import { Vector4i } from '../../types/board';
import { Colors } from '../../constants/colors';
import { MiniBoard2D } from './MiniBoard2D';

interface BoardUltimateProps {
  board: BoardModel;
  onCellPress: (pos: Vector4i) => void;
  winningLine?: Vector4i[] | null;
  suggestedCell?: Vector4i | null;
  disabled?: boolean;
}

export const BoardUltimate: React.FC<BoardUltimateProps> = ({
  board,
  onCellPress,
  winningLine,
  suggestedCell,
  disabled = false,
}) => {
  const { width } = useWindowDimensions();

  // Dimensión calculada para mantener proporción óptima en pantallas móviles
  const maxBoardWidth = Math.min(width - 20, 390);
  const miniSize = Math.floor((maxBoardWidth - 24) / 3);

  const isMiniBoardInGlobalWin = (w: number, z: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.w === w && p.z === z);
  };

  const getTargetMiniLabel = (): string => {
    if (board.activeMacro === null) {
      return 'Cualquier tablero disponible (Turno libre)';
    }
    const macroRow = Math.floor(board.activeMacro / 3) + 1;
    const macroCol = (board.activeMacro % 3) + 1;
    return `Tablero activo: ${board.activeMacro + 1} (Fila ${macroRow}, Col ${macroCol})`;
  };

  return (
    <View style={styles.outerContainer}>
      {/* Indicador de regla de destino forzado */}
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>✦ {getTargetMiniLabel()}</Text>
      </View>

      {/* Tablero macro 3x3 */}
      <View style={[styles.macroBoard, { width: maxBoardWidth }]}>
        {Array.from({ length: 3 }).map((_, w) => (
          <View key={`macro-row-${w}`} style={styles.macroRow}>
            {Array.from({ length: 3 }).map((_, z) => {
              const macroIdx = w * 3 + z;
              const isWon = board.getMiniBoardWinner(macroIdx);
              const isTargetActive =
                board.activeMacro === null || board.activeMacro === macroIdx;
              const miniWinLine = board.getMiniBoardWinningLine(macroIdx);
              const inGlobalWin = isMiniBoardInGlobalWin(w, z);

              return (
                <View
                  key={`macro-${w}-${z}`}
                  style={[inGlobalWin && styles.globalWinGlow]}
                >
                  <MiniBoard2D
                    macroIdx={macroIdx}
                    board={board}
                    miniSize={miniSize}
                    isActive={isTargetActive}
                    isWon={isWon}
                    winningLine={miniWinLine}
                    suggestedCell={suggestedCell}
                    onCellPress={onCellPress}
                    disabled={disabled}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  statusBadge: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  statusText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  macroBoard: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 2.5,
    borderRadius: 20,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  macroRow: {
    flexDirection: 'row',
  },
  globalWinGlow: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.winLine,
    shadowColor: Colors.winLine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
});
