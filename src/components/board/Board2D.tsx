import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BoardModel } from '../../game/board/BoardModel';
import { Vector4i, areVectorsEqual, CellSymbol } from '../../types/board';
import { Colors } from '../../constants/colors';
import { Cell2D } from './Cell2D';

import { PowerType } from '../../types/powers';

interface Board2DProps {
  board: BoardModel;
  onCellPress: (pos: Vector4i) => void;
  winningLine?: Vector4i[] | null;
  suggestedCell?: Vector4i | null;
  currentTurn?: CellSymbol;
  selectedPiece?: Vector4i | null;
  activePower?: PowerType | null;
  powerTargetFirst?: Vector4i | null;
  disabled?: boolean;
}

export const Board2D: React.FC<Board2DProps> = ({
  board,
  onCellPress,
  winningLine,
  suggestedCell,
  currentTurn,
  selectedPiece,
  activePower,
  powerTargetFirst,
  disabled = false,
}) => {
  const { width } = useWindowDimensions();
  const gridSize = board.gridSize;

  // Cálculo del tamaño óptimo de celda para pantallas móviles
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

  const expiringCell =
    board.isLimited() && currentTurn ? board.getExpiringPiece(currentTurn) : null;

  const isCellExpiring = (r: number, c: number): boolean => {
    if (!expiringCell) return false;
    return areVectorsEqual({ x: r, y: c, z: 0, w: 0 }, expiringCell);
  };

  const isCellSelected = (r: number, c: number): boolean => {
    const currentPos = { x: r, y: c, z: 0, w: 0 };
    if (selectedPiece && areVectorsEqual(currentPos, selectedPiece)) return true;
    if (powerTargetFirst && areVectorsEqual(currentPos, powerTargetFirst)) return true;
    return false;
  };

  const isCellDestination = (r: number, c: number): boolean => {
    if (!selectedPiece || !board.isMovement() || !board.isMovementPhase()) return false;
    const pos = { x: r, y: c, z: 0, w: 0 };
    return board.isCellEmpty(pos) && board.isAdjacent(selectedPiece, pos);
  };

  const isCellSelectable = (r: number, c: number): boolean => {
    const pos = { x: r, y: c, z: 0, w: 0 };
    const cellSym = board.getCell(pos);

    // Modo Movimiento
    if (board.isMovement() && board.isMovementPhase() && currentTurn) {
      return cellSym === currentTurn;
    }

    // Modo Poderes
    if (board.isPowers() && activePower) {
      if (activePower === PowerType.Bomb) {
        // Puede bombardear cualquier ficha (X u O)
        return cellSym === 'X' || cellSym === 'O';
      }
      if (activePower === PowerType.Swap) {
        // Puede intercambiar fichas del tablero (X u O)
        return cellSym === 'X' || cellSym === 'O';
      }
      if (activePower === PowerType.BlockCell) {
        // Puede bloquear casillas vacías
        return cellSym === ' ';
      }
      if (activePower === PowerType.DoubleTurn) {
        // Puede colocar en casillas vacías
        return cellSym === ' ';
      }
    }

    return false;
  };

  return (
    <View style={[styles.container, { width: maxBoardWidth }]}>
      {Array.from({ length: gridSize }).map((_, r) => (
        <View key={`row-${r}`} style={styles.row}>
          {Array.from({ length: gridSize }).map((_, c) => {
            const symbol = board.getCell2D(r, c);
            return (
              <Cell2D
                key={`cell-${r}-${c}`}
                row={r}
                col={c}
                size={cellSize}
                symbol={symbol}
                isWinningCell={isWinningCell(r, c)}
                isSuggested={isSuggested(r, c)}
                isExpiring={isCellExpiring(r, c)}
                isSelected={isCellSelected(r, c)}
                isDestination={isCellDestination(r, c)}
                isSelectable={isCellSelectable(r, c)}
                disabled={disabled}
                onPress={() => onCellPress({ x: r, y: c, z: 0, w: 0 })}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 2,
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 14,
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
