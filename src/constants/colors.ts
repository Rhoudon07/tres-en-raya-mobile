/**
 * Paleta de colores oficial (Dark Minimalist Theme)
 * Fiel a include/Constants.h del proyecto C++/SFML
 */
export const Colors = {
  // Fondo general
  background: '#141721',          // Azul pizarra oscuro profundo
  boardSurface: '#1c212f',        // Superficie elevada del tablero
  boardBorder: '#2a3144',         // Borde sutil del tablero

  // Casillas
  cellNormal: '#23293a',          // Casilla en reposo
  cellHover: '#30384f',           // Casilla con hover / pulsación
  cellBorder: '#374058',          // Borde de casilla
  cellHighlightWin: '#28414b',    // Resaltado de casilla ganadora

  // Fichas
  playerX: '#00d4ff',             // Cian neón vibrante
  playerO: '#ff4d79',             // Rosa / Coral vibrante
  winLine: '#ffd700',             // Dorado resplandeciente

  // Textos
  textPrimary: '#f8fafc',         // Blanco puro
  textSecondary: '#94a3b8',       // Gris claro
  textMuted: '#64748b',           // Gris apagado

  // Botones
  buttonNormal: '#262c3e',        // Fondo botón normal
  buttonHover: '#38415c',         // Fondo botón hover/pressed
  buttonPressed: '#1c212f',       // Fondo botón presionado
  buttonBorder: '#444f6e',        // Borde del botón
  buttonBorderHover: '#00d4ff',   // Borde con acento cian

  // Botones de acción / acento
  accentCyan: '#00d4ff',
  accentPink: '#ff4d79',
  accentGreen: '#22c55e',         // Verde éxito

  // Modal Overlay
  modalOverlay: 'rgba(10, 12, 18, 0.85)',
  modalSurface: '#191e2a',
  modalBorder: '#3c465f',

  // Game Review (Calidad de jugadas)
  reviewBest: '#00e676',          // Verde esmeralda (100% precisión / Mejor jugada / Sugerencia IA)
  reviewGood: '#00e5ff',          // Cian brillante (80% precisión / Buena jugada)
  reviewInaccuracy: '#ffd700',    // Amarillo ámbar (50% precisión / Imprecisión)
  reviewMistake: '#ff9100',       // Naranja vivo (25% precisión / Error táctico)
  reviewBlunder: '#ff1744',       // Rojo intenso (0% precisión / Pifia grave)
  reviewInfo: '#64748b',          // Gris informativo para inicio
} as const;
