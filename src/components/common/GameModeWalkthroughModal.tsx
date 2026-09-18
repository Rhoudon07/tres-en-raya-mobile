import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BoardType } from '../../types/board';
import { GameButton } from './GameButton';
import { Badge } from './Badge';
import {
  BookOpen,
  X,
  Sparkles,
  Target,
  Zap,
  HelpCircle,
  FlaskConical,
  Box,
  Layers,
  Flame,
  Grid,
} from 'lucide-react-native';

export interface WalkthroughData {
  title: string;
  category: string;
  summary: string;
  objective: string;
  rules: string[];
  tips: string[];
  accentColor: string;
}

export const WALKTHROUGHS: Record<string, WalkthroughData> = {
  [BoardType.TicTacToe3x3]: {
    title: '3x3 CLÁSICO',
    category: 'TRADICIONAL',
    summary: 'El Tres en Raya milenario en cuadrícula de 9 casillas.',
    objective: 'Conectar 3 fichas consecutivas en línea recta (horizontal, vertical o diagonal).',
    rules: [
      'Los jugadores alternan turnos colocando una ficha en cualquier celda libre.',
      'El primer jugador en completar una línea de 3 gana la partida.',
      'Si se llenan las 9 casillas sin un ganador, la partida termina en tablas/empate.',
    ],
    tips: [
      'Controla la casilla central (1,1) para abrir 4 líneas ganadoras a la vez.',
      'Crea una "horquilla" (doble amenaza) atacando en dos esquinas opuestas.',
    ],
    accentColor: Colors.accentCyan,
  },
  [BoardType.Limited3x3]: {
    title: 'FICHAS LIMITADAS (3 MÁX)',
    category: 'DINÁMICO CON MEMORIA',
    summary: 'Tres en Raya dinámico donde ninguna partida puede terminar en empate.',
    objective: 'Formar 3 en raya manteniendo tu ciclo de fichas activo.',
    rules: [
      'Cada jugador puede tener un máximo de 3 fichas simultáneas en el tablero.',
      'Al colocar tu 4ª ficha, tu ficha más antigua en el tablero desaparece automáticamente (cola FIFO).',
      'La ficha más antigua parpadea o se atenúa indicando que será la próxima en evaporarse.',
    ],
    tips: [
      'No confíes en defensas estáticas: la ficha que bloquea puede desvanecerse en tu siguiente turno.',
      'Obliga a tu oponente a colocar fichas forzadas para destruir sus líneas previas.',
    ],
    accentColor: '#f97316',
  },
  [BoardType.Misere3x3]: {
    title: '3x3 MISÈRE (INVERSO)',
    category: 'ESTRATEGIA INVERSA',
    summary: 'Variante inversa donde la victoria tradicional significa la derrota.',
    objective: 'Obligar a tu rival a completar una línea de 3 en raya.',
    rules: [
      '¡Quien forme 3 fichas consecutivas en cualquier dirección PIERDE inmediatamente!',
      'Gana el jugador que no haya completado ninguna línea al finalizar el juego o forzar al oponente.',
    ],
    tips: [
      'Evita casillas centrales en la apertura, pues participan en la mayor cantidad de líneas.',
      'Construye configuraciones en forma de "L" o esquinas asimétricas que restrinjan los movimientos seguros del rival.',
    ],
    accentColor: '#ef4444',
  },
  [BoardType.Movement3x3]: {
    title: '3x3 MOVIMIENTO (TAPATAN)',
    category: 'DESPLAZAMIENTO TÁCTICO',
    summary: 'Juego de dos fases: colocación estratégica y desplazamiento adyacente.',
    objective: 'Alinear tus 3 fichas tras moverlas por el tablero.',
    rules: [
      'Fase 1 (Colocación): Cada jugador coloca sus 3 fichas en casillas vacías alternativamente.',
      'Fase 2 (Desplazamiento): En cada turno, selecciona una de tus fichas y muévela a una casilla vacía ortogonalmente o diagonalmente conectada.',
      'No se pueden saltar casillas ni mover a celdas ocupadas.',
    ],
    tips: [
      'En la fase de colocación, ubica tus fichas en zonas con alta conectividad (como el centro).',
      'Intenta bloquear los movimientos del rival para dejarlo sin opciones legales ("zugzwang").',
    ],
    accentColor: '#10b981',
  },
  [BoardType.TimeAttack3x3]: {
    title: '3x3 CONTRARRELOJ (BLITZ)',
    category: 'REFLEJOS Y VELOCIDAD',
    summary: 'Partida relámpago con presión estricta de tiempo por jugada.',
    objective: 'Completar 3 en raya antes de que expire tu temporizador.',
    rules: [
      'Cuentas con un temporizador de 5 segundos para realizar cada jugada.',
      'Si tu reloj llega a cero (0.0s), ¡pierdes la partida de inmediato por tiempo!',
    ],
    tips: [
      'Mantén la mirada en el centro y las diagonales principales para decidir en menos de 2 segundos.',
      'Juega rápido para trasladar la presión mental al reloj del oponente.',
    ],
    accentColor: '#eab308',
  },
  [BoardType.TicTacToe3D]: {
    title: '3x3x3 QUBIC (3D)',
    category: 'TRIDIMENSIONAL',
    summary: 'Un cubo espacial de 3 pisos de 3x3 (27 casillas y 49 líneas ganadoras).',
    objective: 'Conectar 3 fichas en cualquier dirección tridimensional.',
    rules: [
      'Hay 3 pisos apilados: Piso 1 (Superior), Piso 2 (Medio) y Piso 3 (Inferior).',
      'Son válidas: líneas planas dentro de cada piso (24 líneas), pilares verticales entre pisos (9 líneas), diagonales en planos verticales/horizontales (12 líneas) y 4 diagonales espaciales que cruzan el corazón del cubo.',
    ],
    tips: [
      'El centro absoluto (1,1,1) es la casilla más poderosa del juego: forma parte de 13 líneas ganadoras distintas.',
      'Las 8 esquinas del cubo participan en 7 líneas cada una; úsalas para tender trampas multidireccionales.',
    ],
    accentColor: Colors.playerO,
  },
  [BoardType.TicTacToe4x4_3D]: {
    title: '4x4x4 3D (QUBIC 4x4)',
    category: 'TRIDIMENSIONAL EXTENDIDO',
    summary: 'Cubo titánico de 4 pisos y 64 casillas con 76 líneas ganadoras posibles.',
    objective: 'Conectar 4 fichas consecutivas en el espacio 3D.',
    rules: [
      'Cuadrícula tridimensional de 4 × 4 × 4 casillas.',
      'Gana el primero en formar 4 en línea horizontal, vertical o diagonal espacial.',
    ],
    tips: [
      'Monitorea las 4 diagonales principales que unen vértices opuestos del hiperespacio.',
      'Controla las 8 casillas del cubo central interior 2x2x2.',
    ],
    accentColor: '#f59e0b',
  },
  [BoardType.TicTacToe4D]: {
    title: '3x3x3x3 TESERACTO (4D)',
    category: 'HIPERDIMENSIONAL',
    summary: 'Estructura hiperdimensional de 81 casillas y 272 líneas ganadoras.',
    objective: 'Conectar 3 fichas alineadas a través de Universos (W), Pisos (Z), Filas y Columnas.',
    rules: [
      'El tablero está dividido en 3 Universos Macro (W1, W2, W3).',
      'Cada Universo contiene 3 Pisos espaciales (Z1, Z2, Z3) de cuadrícula 3x3.',
      'Las hiperdiagonales pueden comenzar en un piso de W1 y cruzar armónicamente hasta W3.',
      'El HUD te alertará exactamente de cada jugada que realice la CPU en universos remotos.',
    ],
    tips: [
      'Utiliza los badges del HUD para saltar al Universo y Piso donde se ejecutó la jugada rival.',
      'El centro absoluto (W2, Z2, 1, 1) es el nodo cuántico de mayor convergencia hiperespacial.',
    ],
    accentColor: '#a855f7',
  },
  [BoardType.Connect4x4]: {
    title: '4x4 LIBRE',
    category: 'TABLERO EXTENDIDO',
    summary: 'Tablero de 16 casillas con colocación libre sin efecto de gravedad.',
    objective: 'Alinear 4 fichas consecutivas (horizontal, vertical o diagonal).',
    rules: [
      'Puedes colocar tu ficha en cualquier casilla vacía del tablero 4x4.',
      'Existen 10 líneas ganadoras: 4 filas, 4 columnas y 2 diagonales completas.',
    ],
    tips: [
      'Las 4 casillas centrales son decisivas para bloquear avances o construir bifurcaciones.',
      'Una ficha en la esquina solo apoya 3 líneas posibles; prioriza el centro.',
    ],
    accentColor: Colors.accentGreen,
  },
  [BoardType.Connect5x5]: {
    title: '5x5 LIBRE',
    category: 'CINCO EN RAYA',
    summary: 'Cuadrícula extendida de 25 casillas para batallas de alta estrategia territorial.',
    objective: 'Alinear 5 fichas consecutivas en cualquier dirección.',
    rules: [
      'Colocación libre en cualquiera de las 25 casillas.',
      'Requiere 5 fichas exactas en línea: 5 horizontales, 5 verticales y 2 diagonales principales.',
    ],
    tips: [
      'Anticípate creando secuencias abiertas por ambos extremos (tres o cuatro fichas abiertas).',
      'No permitas que el rival consiga 4 fichas consecutivas con extremos libres.',
    ],
    accentColor: '#ec4899',
  },
  [BoardType.Gravity4x4]: {
    title: '4x4 CON GRAVEDAD',
    category: 'ESTILO CONECTA 4',
    summary: 'Física gravitacional en tablero vertical 4x4.',
    objective: 'Conectar 4 fichas en línea aprovechando la caída por gravedad.',
    rules: [
      'Toca la columna deseada: la ficha caerá hasta la posición más baja disponible.',
      'No se pueden colocar fichas en casillas flotantes intermedias.',
      'Cuando una columna se llena con 4 fichas, queda bloqueada para jugadas futuras.',
    ],
    tips: [
      'No coloques fichas que sirvan de "escalón" para que tu rival apoye su 4ª ficha ganadora en el turno siguiente.',
      'Planea trampas de doble amenaza en columnas contiguas.',
    ],
    accentColor: Colors.winLine,
  },
  [BoardType.Ultimate]: {
    title: 'ULTIMATE TIC-TAC-TOE',
    category: 'ESTRATEGIA PROFUNDA',
    summary: 'Macro-tablero compuesto por 9 mini-tableros 3x3 interactivos (81 casillas).',
    objective: 'Ganar 3 mini-tableros en línea recta dentro del macro-tablero.',
    rules: [
      'Tu jugada en una celda local (x, y) envía obligatoriamente a tu oponente al mini-tablero correspondiente en esa posición.',
      'Si el mini-tablero destino ya está ganado o lleno, el jugador obtiene "tiro libre" en cualquier tablero.',
      'Ganar un mini-tablero lo convierte en una casilla macro (X o O).',
    ],
    tips: [
      'Elige tus jugadas no solo para ganar el mini-tablero local, sino para enviar al rival a un tablero donde no tenga ventajas.',
      'Sacrificar un mini-tablero para forzar al rival a darte tiro libre puede definir la partida.',
    ],
    accentColor: '#38bdf8',
  },
  [BoardType.Obstacles4x4]: {
    title: '4x4 CON OBSTÁCULOS',
    category: 'ZONA DE BLOQUEO',
    summary: 'Tablero 4x4 con casillas rocosas intransitables generadas proceduralmente.',
    objective: 'Alinear 4 fichas sorteando las rocas bloqueantes.',
    rules: [
      'Las casillas con rocas (#) no pueden ser ocupadas por ningún jugador.',
      'Las líneas que atraviesan una roca quedan anuladas.',
    ],
    tips: [
      'Identifica desde el primer segundo qué filas y columnas continúan teniendo las 4 casillas libres.',
      'Utiliza los obstáculos como escudo para cortar las líneas de ataque del rival.',
    ],
    accentColor: '#94a3b8',
  },
  [BoardType.ThreePlayers3x3]: {
    title: '3 JUGADORES (3x3)',
    category: 'BATALLA A TRES BANDAS',
    summary: 'Tres contendientes (X, O, Y) disputándose el mismo tablero 3x3.',
    objective: 'Ser el primero en conectar 3 en raya de tu símbolo.',
    rules: [
      'Los turnos rotan en secuencia circular: Jugador X → Jugador O → Jugador Y.',
      'Cualquier jugador que complete 3 en raya gana la partida instantáneamente.',
    ],
    tips: [
      'Equilibra el ataque y la defensa: bloquear a un jugador puede regalarle la victoria al tercer contendiente.',
      'Provoca disputas entre los otros dos rivales para deslizar tu jugada ganadora.',
    ],
    accentColor: Colors.playerY,
  },
  [BoardType.ThreePlayers5x5]: {
    title: '3 JUGADORES (5x5)',
    category: 'BATALLA A TRES BANDAS',
    summary: 'Batalla a tres bandas (X, O, Y) en cuadrícula ampliada de 25 casillas.',
    objective: 'Conectar 4 fichas consecutivas de tu símbolo en el tablero 5x5.',
    rules: [
      'Turnos cíclicos entre X, O e Y.',
      'Gana el primero en lograr 4 fichas en línea en cualquier dirección.',
    ],
    tips: [
      'Aprovecha la amplitud del tablero para iniciar ataques en zonas desatendidas.',
      'Construye amenazas dobles para que un solo rival no pueda neutralizarte.',
    ],
    accentColor: '#a855f7',
  },
  [BoardType.Powers3x3]: {
    title: '5x5 CON HABILIDADES',
    category: 'PODERES TÁCTICOS',
    summary: 'Cinco en raya equipado con 4 habilidades tácticas (1 uso por partida).',
    objective: 'Conectar 5 en raya utilizando tus poderes en el momento clave.',
    rules: [
      '💥 Bomba: Destruye cualquier ficha del rival o propia.',
      '🔄 2X Turno: Te permite colocar dos fichas consecutivas en tu turno.',
      '🪨 Bloqueo: Inutiliza permanentemente una casilla vacía con una roca.',
      '🔀 Swap: Intercambia las posiciones de dos fichas del tablero.',
      'Solo se permite 1 uso de habilidad por jugador en toda la partida.',
    ],
    tips: [
      'Guarda el Doble Turno para cerrar una línea de 4 y dar el golpe de gracia.',
      'Usa el Swap o la Bomba para desmontar de imprevisto una amenaza inminente del adversario.',
    ],
    accentColor: '#f43f5e',
  },
  [BoardType.Custom]: {
    title: 'MODO LABORATORIO',
    category: 'SANDBOX TOTAL',
    summary: 'Crea y experimenta tus propias variantes de juego con reglas personalizadas.',
    objective: 'Jugar partidas con combinaciones únicas de física, dimensiones y habilidades.',
    rules: [
      '📐 Dimensiones: Selecciona entre 3x3, 4x4, 5x5, 3D o 4D.',
      '🎯 Condición de Victoria: Define si se requieren 3, 4 o 5 fichas en línea.',
      '🌍 Física: Activa la gravedad estilo Conecta 4.',
      '⏳ Fichas Limitadas: Establece un límite de fichas (3, 4 o 5) con evaporación FIFO.',
      '🪨 Obstáculos: Elige el número de rocas generadas al azar.',
      '✨ Poderes: Habilita el arsenal de habilidades especiales.',
      '🔗 Semillas: Exporta o importa códigos de semilla para compartir tus reglas con otros jugadores.',
    ],
    tips: [
      'Prueba combinaciones salvajes como 5x5 con Gravedad + Fichas Limitadas + Poderes.',
      'Utiliza los presets preconfigurados para saltar rápido a modalidades populares.',
    ],
    accentColor: '#a855f7',
  },
};

interface WalkthroughModalProps {
  visible: boolean;
  boardType: BoardType | string;
  onClose: () => void;
}

export const GameModeWalkthroughModal: React.FC<WalkthroughModalProps> = ({
  visible,
  boardType,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const info: WalkthroughData =
    WALKTHROUGHS[boardType] || WALKTHROUGHS[BoardType.TicTacToe3x3];

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
          tension: 75,
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
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], borderColor: info.accentColor },
          ]}
        >
          {/* Cabecera del Walkthrough */}
          <View style={styles.headerRow}>
            <View style={styles.titleArea}>
              <Badge label={info.category} color={info.accentColor} size="small" />
              <Text style={styles.title}>{info.title}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar guía"
            >
              <X size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Resumen */}
            <Text style={styles.summaryText}>{info.summary}</Text>

            {/* Objetivo */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <Target size={16} color={info.accentColor} />
                <Text style={[styles.sectionTitle, { color: info.accentColor }]}>
                  OBJETIVO DE VICTORIA
                </Text>
              </View>
              <Text style={styles.objectiveText}>{info.objective}</Text>
            </View>

            {/* Reglas Clave */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <BookOpen size={16} color={Colors.accentCyan} />
                <Text style={[styles.sectionTitle, { color: Colors.accentCyan }]}>
                  CÓMO JUGAR
                </Text>
              </View>
              {info.rules.map((rule, idx) => (
                <View key={`rule-${idx}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: info.accentColor }]}>•</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>

            {/* Consejos Tácticos */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <Zap size={16} color="#f59e0b" />
                <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>
                  CONSEJOS Y ESTRATEGIA
                </Text>
              </View>
              {info.tips.map((tip, idx) => (
                <View key={`tip-${idx}`} style={styles.bulletRow}>
                  <Text style={styles.bulletDotOrange}>⚡</Text>
                  <Text style={styles.ruleText}>{tip}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Botón de acción */}
          <GameButton
            title="¡ENTENDIDO, A JUGAR!"
            variant="accent"
            size="medium"
            onPress={onClose}
            style={[styles.confirmBtn, { borderColor: info.accentColor }]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    backgroundColor: Colors.boardSurface,
    borderWidth: 2,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1a202c',
  },
  scrollArea: {
    marginVertical: 6,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  sectionBox: {
    backgroundColor: '#121622',
    borderColor: '#1e2638',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  objectiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingRight: 10,
  },
  bulletDot: {
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
    lineHeight: 20,
  },
  bulletDotOrange: {
    fontSize: 12,
    marginRight: 6,
    lineHeight: 20,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  confirmBtn: {
    marginTop: 10,
  },
});
