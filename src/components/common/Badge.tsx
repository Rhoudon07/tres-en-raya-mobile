import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = Colors.accentCyan,
  style,
  textStyle,
  size = 'small',
  icon,
}) => {
  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color,
          backgroundColor: `${color}25`, // 15% opacidad
        },
        size === 'medium' && styles.medium,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color }, size === 'medium' && styles.textMedium, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 5,
  },
  medium: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  textMedium: {
    fontSize: 13,
  },
});
