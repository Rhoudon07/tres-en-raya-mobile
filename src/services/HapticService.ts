import * as Haptics from 'expo-haptics';

export class HapticService {
  private static enabled: boolean = true;

  public static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  public static lightImpact() {
    if (!this.enabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Plataforma no soportada o entorno web
    }
  }

  public static mediumImpact() {
    if (!this.enabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }

  public static selection() {
    if (!this.enabled) return;
    try {
      Haptics.selectionAsync();
    } catch {}
  }

  public static success() {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }

  public static warning() {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }
}
