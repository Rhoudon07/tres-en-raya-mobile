import { BoardType } from './board';
import { Difficulty } from './ai';
import { CustomGameRules } from './lab';

export interface CampaignStarCondition {
  star: 1 | 2 | 3;
  description: string;
  type: 'win' | 'max_moves' | 'min_accuracy' | 'no_timeout';
  threshold?: number;
}

export interface CampaignLevel {
  id: number;
  worldId: number;
  title: string;
  subtitle: string;
  description: string;
  boardType: BoardType;
  customRules?: CustomGameRules;
  aiDifficulty: Difficulty;
  isBoss?: boolean;
  bossName?: string;
  bossAvatar?: string;
  bossDialogue?: string;
  bossDefeatDialogue?: string;
  starConditions: [CampaignStarCondition, CampaignStarCondition, CampaignStarCondition];
}

export interface CampaignWorld {
  id: number;
  title: string;
  subtitle: string;
  themeColor: string;
  accentColor: string;
  levelIds: number[];
}

export interface CampaignLevelProgress {
  levelId: number;
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0..3
  highScore: number;
  bestMoves?: number;
}

export const CAMPAIGN_WORLDS: CampaignWorld[] = [
  {
    id: 1,
    title: 'Mundo 1: El Origen',
    subtitle: 'El Dominio del 3x3 Clásico',
    themeColor: '#0ea5e9',
    accentColor: '#38bdf8',
    levelIds: [1, 2, 3, 4],
  },
  {
    id: 2,
    title: 'Mundo 2: Cuatro Direcciones',
    subtitle: 'Tableros 4x4, Gravedad y Obstáculos',
    themeColor: '#8b5cf6',
    accentColor: '#a855f7',
    levelIds: [5, 6, 7, 8],
  },
  {
    id: 3,
    title: 'Mundo 3: Caos y Dimensiones',
    subtitle: '3 Jugadores, Hiperespacio y Macro-Estrategia',
    themeColor: '#f59e0b',
    accentColor: '#fbbf24',
    levelIds: [9, 10, 11, 12],
  },
];

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  // --- MUNDO 1: EL ORIGEN ---
  {
    id: 1,
    worldId: 1,
    title: 'El Primer Paso',
    subtitle: 'Tres en Raya Tradicional',
    description: 'Aprende los fundamentos tácticos de control de esquinas y centro.',
    boardType: BoardType.TicTacToe3x3,
    aiDifficulty: Difficulty.Easy,
    starConditions: [
      { star: 1, description: 'Gana la partida', type: 'win' },
      { star: 2, description: 'Gana en 5 movimientos o menos', type: 'max_moves', threshold: 5 },
      { star: 3, description: 'Precisión táctica de al menos 75%', type: 'min_accuracy', threshold: 75 },
    ],
  },
  {
    id: 2,
    worldId: 1,
    title: 'El Espejo Inverso',
    subtitle: 'Regla Misère Obligatoria',
    description: '¡Cuidado! Quien complete 3 en raya pierde inmediatamente. Fuerza el error rival.',
    boardType: BoardType.Misere3x3,
    aiDifficulty: Difficulty.Medium,
    starConditions: [
      { star: 1, description: 'Fuerza al rival a alinear 3 fichas', type: 'win' },
      { star: 2, description: 'Gana en 6 movimientos o menos', type: 'max_moves', threshold: 6 },
      { star: 3, description: 'Precisión táctica de al menos 80%', type: 'min_accuracy', threshold: 80 },
    ],
  },
  {
    id: 3,
    worldId: 1,
    title: 'La Danza Efímera',
    subtitle: 'Fichas Limitadas (Máximo 3)',
    description: 'Al colocar la 4ª ficha, tu ficha más antigua desaparece del tablero.',
    boardType: BoardType.Limited3x3,
    aiDifficulty: Difficulty.Medium,
    starConditions: [
      { star: 1, description: 'Gana la partida con fichas dinámicas', type: 'win' },
      { star: 2, description: 'Gana en 8 movimientos o menos', type: 'max_moves', threshold: 8 },
      { star: 3, description: 'Precisión táctica de al menos 80%', type: 'min_accuracy', threshold: 80 },
    ],
  },
  {
    id: 4,
    worldId: 1,
    title: 'Jefe: El Cronometrador',
    subtitle: 'Contrarreloj Extremo',
    description: 'El guardián del tiempo te obliga a jugar con 5 segundos por turno.',
    boardType: BoardType.TimeAttack3x3,
    aiDifficulty: Difficulty.Hard,
    isBoss: true,
    bossName: 'Cronos, El Cronometrador',
    bossAvatar: '⏳',
    bossDialogue: 'El tiempo no perdona a los indecisos... ¿Podrás pensar en 5 segundos o colapsarás?',
    bossDefeatDialogue: 'Imposible... tu mente calcula más velozmente que las manecillas del destino.',
    starConditions: [
      { star: 1, description: 'Derrota al Cronometrador', type: 'win' },
      { star: 2, description: 'Gana sin agotar el temporizador', type: 'no_timeout' },
      { star: 3, description: 'Gana en 6 movimientos o menos', type: 'max_moves', threshold: 6 },
    ],
  },

  // --- MUNDO 2: CUATRO DIRECCIONES ---
  {
    id: 5,
    worldId: 2,
    title: 'Expansión Cuántica',
    subtitle: 'Tablero 4x4 Libre',
    description: 'El tablero se expande a 16 casillas. Conecta 4 fichas en cualquier dirección.',
    boardType: BoardType.Connect4x4,
    aiDifficulty: Difficulty.Medium,
    starConditions: [
      { star: 1, description: 'Conecta 4 en línea', type: 'win' },
      { star: 2, description: 'Gana en 10 movimientos o menos', type: 'max_moves', threshold: 10 },
      { star: 3, description: 'Precisión táctica de al menos 80%', type: 'min_accuracy', threshold: 80 },
    ],
  },
  {
    id: 6,
    worldId: 2,
    title: 'El Peso del Vacío',
    subtitle: '4x4 con Gravedad Connect',
    description: 'Las fichas caen hasta la fila más baja disponible por física de gravedad.',
    boardType: BoardType.Gravity4x4,
    aiDifficulty: Difficulty.Medium,
    starConditions: [
      { star: 1, description: 'Conecta 4 con física de gravedad', type: 'win' },
      { star: 2, description: 'Gana en 8 movimientos o menos', type: 'max_moves', threshold: 8 },
      { star: 3, description: 'Precisión táctica de al menos 85%', type: 'min_accuracy', threshold: 85 },
    ],
  },
  {
    id: 7,
    worldId: 2,
    title: 'Campos Minados',
    subtitle: '4x4 con Obstáculos',
    description: 'Casillas bloqueadas permanentemente limitan las diagonales y filas.',
    boardType: BoardType.Obstacles4x4,
    aiDifficulty: Difficulty.Hard,
    starConditions: [
      { star: 1, description: 'Gana con obstáculos en el tablero', type: 'win' },
      { star: 2, description: 'Gana en 10 movimientos o menos', type: 'max_moves', threshold: 10 },
      { star: 3, description: 'Precisión táctica de al menos 85%', type: 'min_accuracy', threshold: 85 },
    ],
  },
  {
    id: 8,
    worldId: 2,
    title: 'Jefe: El Cantero',
    subtitle: 'Muralla de Piedra y Fichas Limitadas',
    description: 'El Cantero erige 3 monolitos y limita tus fichas a 4 en un tablero 4x4.',
    boardType: BoardType.Custom,
    customRules: {
      dimension: '4x4',
      winCondition: 4,
      gravity: false,
      limitedPieces: 4,
      misere: false,
      obstacles: 3,
      turnTimer: 0,
      playerCount: 2,
    },
    aiDifficulty: Difficulty.Hard,
    isBoss: true,
    bossName: 'Gólem, El Cantero',
    bossAvatar: '🗿',
    bossDialogue: 'Mis monolitos han resistido eras enteras. Tu avance terminará contra roca sólida.',
    bossDefeatDialogue: 'Mis murallas se quiebran... has esculpido tu victoria en piedra viva.',
    starConditions: [
      { star: 1, description: 'Quebra las defensas del Cantero', type: 'win' },
      { star: 2, description: 'Gana en 12 movimientos o menos', type: 'max_moves', threshold: 12 },
      { star: 3, description: 'Precisión táctica de al menos 85%', type: 'min_accuracy', threshold: 85 },
    ],
  },

  // --- MUNDO 3: CAOS Y DIMENSIONES ---
  {
    id: 9,
    worldId: 3,
    title: 'Vórtice Triangular',
    subtitle: 'Tres Jugadores Simultáneos',
    description: 'Una batalla a tres bandas: X vs O vs Y. Controla las amenazas dobles.',
    boardType: BoardType.ThreePlayers3x3,
    aiDifficulty: Difficulty.Hard,
    starConditions: [
      { star: 1, description: 'Gana la batalla a tres bandas', type: 'win' },
      { star: 2, description: 'Gana en 8 rondas o menos', type: 'max_moves', threshold: 8 },
      { star: 3, description: 'Precisión táctica de al menos 80%', type: 'min_accuracy', threshold: 80 },
    ],
  },
  {
    id: 10,
    worldId: 3,
    title: 'El Cubo de Qubic',
    subtitle: 'Tic-Tac-Toe 3D (3x3x3)',
    description: '27 casillas y 49 líneas ganadoras en el espacio tridimensional.',
    boardType: BoardType.TicTacToe3D,
    aiDifficulty: Difficulty.Hard,
    starConditions: [
      { star: 1, description: 'Conecta 3 en el espacio 3D', type: 'win' },
      { star: 2, description: 'Gana en 8 movimientos o menos', type: 'max_moves', threshold: 8 },
      { star: 3, description: 'Precisión táctica de al menos 85%', type: 'min_accuracy', threshold: 85 },
    ],
  },
  {
    id: 11,
    worldId: 3,
    title: 'Teseracto Hiperdimensional',
    subtitle: 'Tic-Tac-Toe 4D (3x3x3x3)',
    description: '81 casillas a través de 4 dimensiones. Requiere visión abstracta superior.',
    boardType: BoardType.TicTacToe4D,
    aiDifficulty: Difficulty.Hard,
    starConditions: [
      { star: 1, description: 'Conecta 3 en la 4ª dimensión', type: 'win' },
      { star: 2, description: 'Gana en 10 movimientos o menos', type: 'max_moves', threshold: 10 },
      { star: 3, description: 'Precisión táctica de al menos 85%', type: 'min_accuracy', threshold: 85 },
    ],
  },
  {
    id: 12,
    worldId: 3,
    title: 'Jefe Final: El Arquitecto',
    subtitle: 'Ultimate Tic-Tac-Toe',
    description: 'La prueba definitiva: 9 tableros entrelazados gobernados por el Arquitecto.',
    boardType: BoardType.Ultimate,
    aiDifficulty: Difficulty.Hard,
    isBoss: true,
    bossName: 'El Arquitecto del Cosmos',
    bossAvatar: '🌌',
    bossDialogue: 'Has dominado el tiempo, la gravedad y el espacio... pero aquí, el tablero juega contigo.',
    bossDefeatDialogue: 'Extraordinario. Has unificado todas las dimensiones. Eres el Gran Maestro Absoluto.',
    starConditions: [
      { star: 1, description: 'Derrota al Arquitecto en Ultimate Tic-Tac-Toe', type: 'win' },
      { star: 2, description: 'Gana en 20 movimientos o menos', type: 'max_moves', threshold: 20 },
      { star: 3, description: 'Precisión táctica de al menos 85%', type: 'min_accuracy', threshold: 85 },
    ],
  },
];
