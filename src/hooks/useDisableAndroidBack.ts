import React from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

/**
 * Hook para gestionar el botón 'ir atrás' de hardware en Android.
 * Permite retroceder de manera fluida y natural a la pantalla previa.
 */
export function useAndroidBackHandler(onBack?: () => boolean) {
  const navigation = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (onBack) {
          return onBack();
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, onBack])
  );
}

// Alias para preservar compatibilidad con pantallas existentes
export const useDisableAndroidBack = useAndroidBackHandler;
