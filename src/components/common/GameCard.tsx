import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface GameCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  highlightColor?: string;
}

export const GameCard: React.FC<GameCardProps> = ({ children, style, highlightColor }) => {
  return (
    <View
      style={[
        styles.card,
        highlightColor ? { borderColor: highlightColor, borderWidth: 1.5 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.boardSurface,
    borderColor: Colors.boardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
});
