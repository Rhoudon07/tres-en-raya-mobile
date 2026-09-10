import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface AccuracyBarProps {
  accuracyX: number;
  accuracyO: number;
}

export const AccuracyBar: React.FC<AccuracyBarProps> = ({ accuracyX, accuracyO }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PRECISIÓN TÁCTICA</Text>

      {/* Jugador X */}
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <Text style={[styles.playerLabel, { color: Colors.playerX }]}>JUGADOR X</Text>
          <Text style={[styles.percentage, { color: Colors.playerX }]}>{accuracyX.toFixed(1)}%</Text>
        </View>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, Math.max(0, accuracyX))}%`, backgroundColor: Colors.playerX },
            ]}
          />
        </View>
      </View>

      {/* Jugador O */}
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <Text style={[styles.playerLabel, { color: Colors.playerO }]}>JUGADOR O</Text>
          <Text style={[styles.percentage, { color: Colors.playerO }]}>{accuracyO.toFixed(1)}%</Text>
        </View>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, Math.max(0, accuracyO))}%`, backgroundColor: Colors.playerO },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#191f2c',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.boardBorder,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '800',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#262f42',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
