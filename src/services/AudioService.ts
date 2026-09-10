import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

// Archivos estáticos de audio compilados directamente en el paquete
const SoundAssets = {
  click: require('../../assets/sounds/click.wav'),
  moveX: require('../../assets/sounds/move_x.wav'),
  moveO: require('../../assets/sounds/move_o.wav'),
  win: require('../../assets/sounds/win.wav'),
  draw: require('../../assets/sounds/draw.wav'),
};

export class AudioService {
  private static enabled: boolean = true;
  private static players: Record<string, AudioPlayer | null> = {};

  public static init() {
    // Inicialización no bloqueante; los reproductores se instancian bajo demanda (lazy)
  }

  public static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  private static playSound(key: keyof typeof SoundAssets) {
    if (!this.enabled) return;

    try {
      if (typeof createAudioPlayer !== 'function') return;

      if (!this.players[key]) {
        this.players[key] = createAudioPlayer(SoundAssets[key]);
      }

      const player = this.players[key];
      if (player) {
        player.seekTo(0).catch(() => {});
        player.play();
      }
    } catch {
      // Audio nunca bloquea la interfaz de usuario
    }
  }

  public static playClick() {
    this.playSound('click');
  }

  public static playMoveX() {
    this.playSound('moveX');
  }

  public static playMoveO() {
    this.playSound('moveO');
  }

  public static playWin() {
    this.playSound('win');
  }

  public static playDraw() {
    this.playSound('draw');
  }
}
