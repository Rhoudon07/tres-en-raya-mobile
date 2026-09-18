import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Score } from '../../types/game';

interface ScoreBoardProps {
  score: Score;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score }) => {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={[styles.symbol, { color: Colors.playerX }]}>X</Text>
        <Text style={[styles.score, { color: Colors.playerX }]}>{score.xWins}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.item}>
        <Text style={[styles.symbol, { color: Colors.playerO }]}>O</Text>
        <Text style={[styles.score, { color: Colors.playerO }]}>{score.oWins}</Text>
      </View>

      {score.yWins !== undefined && (
        <>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Text style={[styles.symbol, { color: Colors.playerY }]}>Y</Text>
            <Text style={[styles.score, { color: Colors.playerY }]}>{score.yWins}</Text>
          </View>
        </>
      )}

      <View style={styles.divider} />

      <View style={styles.item}>
        <Text style={styles.drawSymbol}>EMPATES</Text>
        <Text style={styles.drawScore}>{score.draws}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  item: {
    alignItems: 'center',
    minWidth: 70,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.boardBorder,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  score: {
    fontSize: 22,
    fontWeight: '800',
  },
  drawSymbol: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  drawScore: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
