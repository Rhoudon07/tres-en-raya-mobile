import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { CellSymbol } from '../../types/board';
import { Colors } from '../../constants/colors';
import { AudioService } from '../../services/AudioService';
import { HapticService } from '../../services/HapticService';

interface GameTimerProps {
  currentTurn: CellSymbol;
  isCpuThinking: boolean;
  gameOver: boolean;
  onTimeout: (timedOutPlayer: CellSymbol) => void;
  secondsPerTurn?: number;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  currentTurn,
  isCpuThinking,
  gameOver,
  onTimeout,
  secondsPerTurn = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState(secondsPerTurn);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const currentTurnRef = useRef(currentTurn);
  currentTurnRef.current = currentTurn;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingMsRef = useRef(secondsPerTurn * 1000);

  useEffect(() => {
    // Reiniciar temporizador al cambiar de turno
    if (gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    remainingMsRef.current = secondsPerTurn * 1000;
    setTimeLeft(secondsPerTurn);
    progressAnim.setValue(1);

    if (isCpuThinking) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const stepMs = 100;
    timerRef.current = setInterval(() => {
      remainingMsRef.current -= stepMs;
      const currentRemaining = Math.max(0, remainingMsRef.current);
      const ratio = currentRemaining / (secondsPerTurn * 1000);

      progressAnim.setValue(ratio);
      setTimeLeft(Math.ceil(currentRemaining / 1000));

      if (currentRemaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        HapticService.warning();
        onTimeout(currentTurnRef.current);
      } else if (currentRemaining <= 2000 && currentRemaining % 1000 === 0) {
        HapticService.lightImpact();
        AudioService.playTick();
      }
    }, stepMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTurn, isCpuThinking, gameOver, secondsPerTurn]);

  // Color reactivo según el tiempo restante
  const barColor =
    timeLeft > 3 ? Colors.accentCyan : timeLeft > 1.5 ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          ⏱️ TIEMPO DE TURNO ({currentTurn})
        </Text>
        <Text style={[styles.timeText, { color: barColor }]}>
          {timeLeft}s
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
