import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/colors';
import { HapticService } from '../../services/HapticService';
import { AudioService } from '../../services/AudioService';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  active?: boolean;
  accessibilityLabel?: string;
}

export const GameButton: React.FC<GameButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  active = false,
  accessibilityLabel,
}) => {
  const handlePress = () => {
    if (disabled) return;
    HapticService.selection();
    AudioService.playClick();
    onPress();
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return '#1e2433';
    if (active) return '#1f334d';
    if (pressed) return Colors.buttonPressed;

    switch (variant) {
      case 'primary':
        return Colors.buttonNormal;
      case 'accent':
        return '#005f73';
      case 'danger':
        return '#4d1928';
      case 'secondary':
        return Colors.boardSurface;
      case 'outline':
        return 'transparent';
    }
  };

  const getBorderColor = () => {
    if (disabled) return '#2e384d';
    if (active) return Colors.accentCyan;
    switch (variant) {
      case 'primary':
        return Colors.buttonBorder;
      case 'accent':
        return Colors.accentCyan;
      case 'danger':
        return Colors.accentPink;
      case 'secondary':
        return Colors.boardBorder;
      case 'outline':
        return Colors.buttonBorder;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    if (active) return Colors.accentCyan;
    switch (variant) {
      case 'accent':
        return Colors.accentCyan;
      case 'danger':
        return Colors.playerO;
      default:
        return Colors.textPrimary;
    }
  };

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  }[size];

  const fontSizeStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  }[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          opacity: disabled ? 0.6 : 1,
        },
        active && styles.activeGlow,
        style,
      ]}
    >
      {icon && <>{icon}</>}
      <Text style={[styles.textBase, fontSizeStyles, { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 6,
    paddingHorizontal: 16,
    // Sombra suave estilo videojuego
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  small: {
    height: 40,
    paddingHorizontal: 12,
  },
  medium: {
    height: 50,
    paddingHorizontal: 18,
  },
  large: {
    height: 60,
    paddingHorizontal: 24,
  },
  textBase: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 13,
  },
  textMedium: {
    fontSize: 15,
  },
  textLarge: {
    fontSize: 18,
  },
  activeGlow: {
    shadowColor: Colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
});
