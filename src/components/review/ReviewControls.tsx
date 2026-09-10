import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GameButton } from '../common/GameButton';

interface ReviewControlsProps {
  currentStep: number;
  totalSteps: number;
  onGoToStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToEnd: () => void;
}

export const ReviewControls: React.FC<ReviewControlsProps> = ({
  currentStep,
  totalSteps,
  onGoToStart,
  onPrev,
  onNext,
  onGoToEnd,
}) => {
  return (
    <View style={styles.container}>
      <GameButton
        title="|<"
        size="small"
        disabled={currentStep <= 0}
        onPress={onGoToStart}
        style={styles.navBtn}
        accessibilityLabel="Ir al inicio"
      />
      <GameButton
        title="< Ant"
        size="small"
        disabled={currentStep <= 0}
        onPress={onPrev}
        style={styles.navBtnWide}
        accessibilityLabel="Jugada anterior"
      />
      <GameButton
        title="Sig >"
        size="small"
        disabled={currentStep >= totalSteps}
        onPress={onNext}
        style={styles.navBtnWide}
        accessibilityLabel="Siguiente jugada"
      />
      <GameButton
        title=">|"
        size="small"
        disabled={currentStep >= totalSteps}
        onPress={onGoToEnd}
        style={styles.navBtn}
        accessibilityLabel="Ir al final"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  navBtn: {
    width: 48,
    marginHorizontal: 4,
  },
  navBtnWide: {
    flex: 1,
    marginHorizontal: 6,
  },
});
