import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { GameButton } from './GameButton';

interface ExitConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]} pointerEvents="auto">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🚪</Text>
          </View>

          <Text style={styles.title}>¿SALIR DEL JUEGO?</Text>

          <Text style={styles.message}>
            ¿Estás seguro de que deseas cerrar la aplicación?
          </Text>

          <View style={styles.actions}>
            <GameButton
              title="SALIR"
              variant="accent"
              size="medium"
              onPress={onConfirm}
              style={styles.exitBtn}
              textStyle={{ color: Colors.textPrimary }}
            />

            <GameButton
              title="CANCELAR"
              variant="secondary"
              size="medium"
              onPress={onCancel}
              style={styles.cancelBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.modalSurface,
    borderColor: Colors.modalBorder,
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 77, 121, 0.15)',
    borderWidth: 1.5,
    borderColor: Colors.playerO,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.playerO,
    letterSpacing: 1.2,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  exitBtn: {
    backgroundColor: Colors.playerO,
    borderColor: Colors.playerO,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
