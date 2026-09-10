import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
  public static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data !== null) {
        return JSON.parse(data) as T;
      }
    } catch (e) {
      console.warn(`[StorageService] Error loading ${key}:`, e);
    }
    return defaultValue;
  }

  public static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[StorageService] Error saving ${key}:`, e);
    }
  }

  public static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageService] Error removing ${key}:`, e);
    }
  }
}
