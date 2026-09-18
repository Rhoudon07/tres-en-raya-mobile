import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Bot, Eye } from 'lucide-react-native';
import { BoardModel } from '../../game/board/BoardModel';
import { Vector4i, areVectorsEqual } from '../../types/board';
import { Colors } from '../../constants/colors';
import { Cell2D } from './Cell2D';
import { WinningStrikeLine } from './WinningStrikeLine';
import { countWinningLinesPassingThrough } from '../../game/board/WinningLines';

interface Board4DProps {
  board: BoardModel;
  onCellPress: (pos: Vector4i) => void;
  winningLine?: Vector4i[] | null;
  suggestedCell?: Vector4i | null;
  disabled?: boolean;
  lastCpuMove?: Vector4i | null;
}

export const Board4D: React.FC<Board4DProps> = ({
  board,
  onCellPress,
  winningLine,
  suggestedCell,
  disabled = false,
  lastCpuMove = null,
}) => {
  const { width } = useWindowDimensions();
  const [activeW, setActiveW] = useState<number>(1); // Universo central por defecto (0..2)
  const [activeZ, setActiveZ] = useState<number>(1); // Piso central por defecto (0..2)
  const [selectedCoord, setSelectedCoord] = useState<Vector4i | null>(null);

  const gridSize = 3;
  const maxBoardWidth = Math.min(width - 32, 380);
  const paddingTotal = (gridSize + 1) * 10;
  const cellSize = Math.floor((maxBoardWidth - paddingTotal) / gridSize);

  const hasWinInUniverse = (w: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.w === w);
  };

  const hasWinOnFloor = (w: number, z: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.w === w && p.z === z);
  };

  const hasSugInUniverse = (w: number): boolean => {
    if (!suggestedCell) return false;
    return suggestedCell.w === w;
  };

  const hasSugOnFloor = (w: number, z: number): boolean => {
    if (!suggestedCell) return false;
    return suggestedCell.w === w && suggestedCell.z === z;
  };

  const isWinningCell = (x: number, y: number, z: number, w: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some((p) => p.x === x && p.y === y && p.z === z && p.w === w);
  };

  const isSuggested = (x: number, y: number, z: number, w: number): boolean => {
    if (!suggestedCell) return false;
    return areVectorsEqual({ x, y, z, w }, suggestedCell);
  };

  const isCpuMoveInUniverse = (w: number): boolean => {
    return lastCpuMove !== null && lastCpuMove !== undefined && lastCpuMove.w === w;
  };

  const isCpuMoveOnFloor = (w: number, z: number): boolean => {
    return (
      lastCpuMove !== null &&
      lastCpuMove !== undefined &&
      lastCpuMove.w === w &&
      lastCpuMove.z === z
    );
  };

  const isCpuCell = (x: number, y: number, z: number, w: number): boolean => {
    if (!lastCpuMove) return false;
    return areVectorsEqual({ x, y, z, w }, lastCpuMove);
  };

  const handleCellPress = (x: number, y: number) => {
    const pos: Vector4i = { x, y, z: activeZ, w: activeW };
    setSelectedCoord(pos);
    onCellPress(pos);
  };

  const linesCount = selectedCoord
    ? countWinningLinesPassingThrough(selectedCoord)
    : countWinningLinesPassingThrough({ x: 1, y: 1, z: activeZ, w: activeW });

  return (
    <View style={[styles.wrapper, { width: maxBoardWidth }]}>
      {/* 0. Notificador interactivo de última jugada de la CPU */}
      {lastCpuMove && (
        <Pressable
          onPress={() => {
            setActiveW(lastCpuMove.w);
            setActiveZ(lastCpuMove.z);
            setSelectedCoord(lastCpuMove);
          }}
          style={({ pressed }) => [
            styles.cpuBanner,
            (lastCpuMove.w !== activeW || lastCpuMove.z !== activeZ) && styles.cpuBannerAway,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.cpuBannerContent}>
            <Bot size={16} color={Colors.accentPink} style={{ marginRight: 6 }} />
            <Text style={styles.cpuBannerText}>
              CPU jugó en:{' '}
              <Text style={styles.cpuBannerCoords}>
                W{lastCpuMove.w + 1} • Z{lastCpuMove.z + 1} • ({lastCpuMove.x + 1},{lastCpuMove.y + 1})
              </Text>
            </Text>
          </View>
          {lastCpuMove.w !== activeW || lastCpuMove.z !== activeZ ? (
            <View style={styles.cpuBannerJumpBtn}>
              <Eye size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.cpuBannerJumpText}>IR AHORA</Text>
            </View>
          ) : (
            <View style={styles.cpuBannerHereBadge}>
              <Text style={styles.cpuBannerHereText}>AQUÍ</Text>
            </View>
          )}
        </Pressable>
      )}

      {/* 1. Selector de Universo W */}
      <View style={styles.selectorSection}>
        <Text style={styles.sectionLabel}>UNIVERSO (W)</Text>
        <View style={styles.tabRow}>
          {[0, 1, 2].map((w) => {
            const isSelected = activeW === w;
            const hasWin = hasWinInUniverse(w);
            const hasSug = hasSugInUniverse(w);
            const isCpu = isCpuMoveInUniverse(w);

            return (
              <Pressable
                key={`uni-${w}`}
                onPress={() => setActiveW(w)}
                style={[
                  styles.tabBtn,
                  isSelected && styles.tabBtnSelectedW,
                  hasWin && styles.tabBtnWin,
                  hasSug && styles.tabBtnSug,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && { color: Colors.accentCyan },
                    hasWin && { color: Colors.winLine },
                    hasSug && { color: Colors.reviewBest },
                  ]}
                >
                  W{w + 1}
                </Text>
                {hasWin && <View style={styles.winDot} />}
                {hasSug && <View style={styles.sugDot} />}
                {isCpu && <View style={styles.cpuDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Selector de Piso Z */}
      <View style={styles.selectorSection}>
        <Text style={styles.sectionLabel}>PISO (Z)</Text>
        <View style={styles.tabRow}>
          {[0, 1, 2].map((z) => {
            const isSelected = activeZ === z;
            const hasWin = hasWinOnFloor(activeW, z);
            const hasSug = hasSugOnFloor(activeW, z);
            const isCpu = isCpuMoveOnFloor(activeW, z);

            return (
              <Pressable
                key={`floor-${z}`}
                onPress={() => setActiveZ(z)}
                style={[
                  styles.tabBtn,
                  isSelected && styles.tabBtnSelectedZ,
                  hasWin && styles.tabBtnWin,
                  hasSug && styles.tabBtnSug,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && { color: Colors.accentPink },
                    hasWin && { color: Colors.winLine },
                    hasSug && { color: Colors.reviewBest },
                  ]}
                >
                  Z{z + 1}
                </Text>
                {hasWin && <View style={styles.winDot} />}
                {hasSug && <View style={styles.sugDot} />}
                {isCpu && <View style={styles.cpuDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. Telemetría 4D en tiempo real */}
      <View style={styles.telemetryCard}>
        <Text style={styles.telemetryCoords}>
          {selectedCoord
            ? `(X: ${selectedCoord.x + 1}, Y: ${selectedCoord.y + 1}, Z: ${selectedCoord.z + 1}, W: ${selectedCoord.w + 1})`
            : `Universo W${activeW + 1} • Piso Z${activeZ + 1}`}
        </Text>
        <Text style={styles.telemetryLines}>
          {linesCount} líneas ganadoras cruzan por esta celda
        </Text>
      </View>

      {/* 4. Tablero 3x3 del Universo W y Piso Z activo */}
      <View style={styles.container}>
        {Array.from({ length: gridSize }).map((_, x) => (
          <View key={`row-${x}`} style={styles.row}>
            {Array.from({ length: gridSize }).map((_, y) => {
              const symbol = board.getCell4D(x, y, activeZ, activeW);
              const isCpu = isCpuCell(x, y, activeZ, activeW);
              return (
                <Cell2D
                  key={`cell-${x}-${y}-${activeZ}-${activeW}`}
                  row={x}
                  col={y}
                  size={cellSize}
                  symbol={symbol}
                  isWinningCell={isWinningCell(x, y, activeZ, activeW)}
                  isSuggested={isSuggested(x, y, activeZ, activeW)}
                  disabled={disabled}
                  style={isCpu ? styles.cpuCellHighlight : undefined}
                  onPress={() => handleCellPress(x, y)}
                />
              );
            })}
          </View>
        ))}

        {winningLine &&
          winningLine.length >= 3 &&
          winningLine.every((p) => p.w === activeW && p.z === activeZ) && (
            <WinningStrikeLine
              winningLine={winningLine}
              boardWidth={maxBoardWidth}
              gridSize={gridSize}
              cellSize={cellSize}
              padding={10 + 4}
              gap={8}
            />
          )}
      </View>

      {/* 5. Si hay victoria hiperdimensional que cruza universos, mostrar coordenadas */}
      {winningLine && (
        <View style={styles.hyperWinBox}>
          <Text style={styles.hyperWinTitle}>✦ VICTORIA HIPERDIMENSIONAL ✦</Text>
          {winningLine.map((p, idx) => (
            <Text key={`win-coord-${idx}`} style={styles.hyperWinCoord}>
              Punto {idx + 1}: (X:{p.x + 1}, Y:{p.y + 1}, Z:{p.z + 1}, W:{p.w + 1})
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  selectorSection: {
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    height: 34,
    marginHorizontal: 4,
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBtnSelectedW: {
    borderColor: Colors.accentCyan,
    backgroundColor: '#1b2f44',
  },
  tabBtnSelectedZ: {
    borderColor: Colors.accentPink,
    backgroundColor: '#381c2b',
  },
  tabBtnWin: {
    borderColor: Colors.winLine,
  },
  tabBtnSug: {
    borderColor: Colors.reviewBest,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  winDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.winLine,
  },
  sugDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.reviewBest,
  },
  telemetryCard: {
    backgroundColor: '#161c28',
    borderColor: Colors.boardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 6,
  },
  telemetryCoords: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accentCyan,
    letterSpacing: 0.5,
  },
  telemetryLines: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
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
  hyperWinBox: {
    backgroundColor: '#262217',
    borderColor: Colors.winLine,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  hyperWinTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.winLine,
    letterSpacing: 1,
    marginBottom: 4,
  },
  hyperWinCoord: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cpuBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#261521',
    borderColor: Colors.accentPink,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: Colors.accentPink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  cpuBannerAway: {
    backgroundColor: '#351227',
    borderColor: '#ff2d75',
  },
  cpuBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cpuBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cpuBannerCoords: {
    color: Colors.accentPink,
    fontWeight: '900',
  },
  cpuBannerJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cpuBannerJumpText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cpuBannerHereBadge: {
    backgroundColor: '#1b3323',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.winLine,
  },
  cpuBannerHereText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.winLine,
    letterSpacing: 0.5,
  },
  cpuDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentPink,
  },
  cpuCellHighlight: {
    borderColor: Colors.accentPink,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 45, 117, 0.18)',
    shadowColor: Colors.accentPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});
