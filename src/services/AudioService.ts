import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * Generador procedural de ondas de audio en memoria.
 * Idéntico a SoundManager.cpp (tonos sinusoidales puros y arpegios).
 */
function generateWavBase64(samples: Int16Array, sampleRate: number = 44100): string {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46); // 'RIFF'
  view.setUint32(4, 36 + dataSize, true);
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45); // 'WAVE'

  // fmt subchunk
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20); // 'fmt '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16 bits per sample

  // data subchunk
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61); // 'data'
  view.setUint32(40, dataSize, true);

  // Escribir muestras PCM
  let offset = 44;
  for (let i = 0; i < samples.length; ++i, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  // Convertir ArrayBuffer a base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + (typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64'));
}

function createToneSamples(freq: number, durationSec: number, volume: number = 0.5): string {
  const sampleRate = 44100;
  const totalSamples = Math.floor(durationSec * sampleRate);
  const samples = new Int16Array(totalSamples);

  for (let i = 0; i < totalSamples; ++i) {
    const t = i / sampleRate;
    const envelope = Math.exp(-5.0 * (i / totalSamples));
    const sine = Math.sin(2.0 * Math.PI * freq * t);
    samples[i] = Math.floor(volume * 32767.0 * envelope * sine);
  }

  return generateWavBase64(samples, sampleRate);
}

function createArpeggioSamples(freqs: number[], noteDurationSec: number, volume: number = 0.5): string {
  const sampleRate = 44100;
  const samplesPerNote = Math.floor(noteDurationSec * sampleRate);
  const totalSamples = samplesPerNote * freqs.length;
  const samples = new Int16Array(totalSamples);

  for (let note = 0; note < freqs.length; ++note) {
    const freq = freqs[note];
    for (let i = 0; i < samplesPerNote; ++i) {
      const globalIdx = note * samplesPerNote + i;
      const t = i / sampleRate;
      const progress = i / samplesPerNote;
      const envelope = Math.exp(-3.5 * progress);
      const sine = Math.sin(2.0 * Math.PI * freq * t);
      samples[globalIdx] = Math.floor(volume * 32767.0 * envelope * sine);
    }
  }

  return generateWavBase64(samples, sampleRate);
}

export class AudioService {
  private static enabled: boolean = true;
  private static clickPlayer: AudioPlayer | null = null;
  private static moveXPlayer: AudioPlayer | null = null;
  private static moveOPlayer: AudioPlayer | null = null;
  private static winPlayer: AudioPlayer | null = null;
  private static drawPlayer: AudioPlayer | null = null;
  private static initialized: boolean = false;

  public static init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      if (typeof createAudioPlayer === 'function') {
        const clickUri = createToneSamples(900.0, 0.04, 0.35);
        const moveXUri = createToneSamples(680.0, 0.08, 0.45);
        const moveOUri = createToneSamples(520.0, 0.09, 0.45);
        const winUri = createArpeggioSamples([523.25, 659.25, 783.99, 1046.50], 0.08, 0.5);
        const drawUri = createArpeggioSamples([293.66, 220.00], 0.12, 0.4);

        this.clickPlayer = createAudioPlayer(clickUri);
        this.moveXPlayer = createAudioPlayer(moveXUri);
        this.moveOPlayer = createAudioPlayer(moveOUri);
        this.winPlayer = createAudioPlayer(winUri);
        this.drawPlayer = createAudioPlayer(drawUri);
      }
    } catch {
      // Ignorar de forma segura si el hardware o módulo nativo aún no está inicializado
    }
  }

  public static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  private static play(player: AudioPlayer | null) {
    if (!this.enabled) return;
    try {
      this.init();
      if (player) {
        player.seekTo(0).catch(() => {});
        player.play();
      }
    } catch {
      // Audio nunca debe romper el ciclo del juego
    }
  }

  public static playClick() {
    this.play(this.clickPlayer);
  }

  public static playMoveX() {
    this.play(this.moveXPlayer);
  }

  public static playMoveO() {
    this.play(this.moveOPlayer);
  }

  public static playWin() {
    this.play(this.winPlayer);
  }

  public static playDraw() {
    this.play(this.drawPlayer);
  }
}
