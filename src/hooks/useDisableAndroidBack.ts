import React from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook para bloquear el botón 'ir atrás' del sistema Android.
 * Evita la navegación hacia atrás por hardware, obligando a usar los botones de la interfaz.
 */
export function useDisableAndroidBack() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Bloquear acción de volver atrás
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );
}
