# Plan de Migración Exhaustivo: Tres en Raya C++17/SFML a React Native (Expo + TypeScript)

> **Documento de Referencia Técnica y Arquitectónica**
> **Proyecto Origen:** `TresEnRaya` (C++17, SFML 2.6 / Visual Studio CMake)
> **Proyecto Destino:** `tres-en-raya-mobile` (React Native 0.76+, Expo SDK 52+, TypeScript, Zustand, Reanimated, React Navigation)

---

## 1. Análisis Exhaustivo de la Arquitectura Original (C++ / SFML)

El repositorio original `https://github.com/Rhoudon07/tres-en-raya` implementa un videojuego de Tres en Raya hiper-dimensional y extensible con interfaz gráfica de escritorio de 900x700 píxeles.

### 1.1 Estructura del Código C++
```text
TresEnRaya/
├── CMakeLists.txt              # Configuración de compilación con soporte para SFML
├── README.md                   # Documentación con especificaciones de algoritmos y modalidades
├── include/
│   ├── AI.h                    # Motor Minimax, heurísticas de evaluación y niveles de dificultad
│   ├── Board.h                 # Estado de casillas 2D/3D/4D, detección de victorias y renderizado SFML
│   ├── Button.h                # Botones interactivos con interpolación de color y hover
│   ├── Constants.h             # Colores (Dark Minimalist), tiempos, tamaños de celdas, Vector4i, enums
│   ├── Game.h                  # Bucle principal, máquina de estados, Game Review (análisis), UI en partida
│   ├── Menu.h                  # Menús (Principal, Dificultad, Turno, Modal Fin de Partida)
│   ├── Player.h                # Modelo de jugador (Humano / CPU, Símbolo, Color)
│   └── SoundManager.h          # Audio dual: archivos WAV o sintetizador procedimental en memoria
├── src/
│   ├── AI.cpp                  # Implementación de Minimax 2D, 4x4, Gravedad, 3D y 4D
│   ├── Board.cpp               # Lógica matemática de 49 líneas (3D) y 272 líneas (4D), proyecciones
│   ├── Button.cpp              # Transición de estados visuales y eventos del ratón
│   ├── Game.cpp                # Implementación de Game Review, precisión, comentarios didácticos
│   ├── Menu.cpp                # Lógica y estilos de botones de selección
│   ├── Player.cpp              # Constructores y getters/setters
│   ├── SoundManager.cpp        # Síntesis matemática de tonos sinusoidales y arpegios
│   └── main.cpp                # Punto de entrada (instancia Game y llama a game.run())
├── tests/
│   └── test_difficulties.cpp   # Pruebas unitarias de persistencia de dificultad y jugadas de IA
└── assets/
    └── fonts/segoeui.ttf       # Tipografía Segoe UI
```

---

## 2. Inventario Completo de Componentes, Clases y Estructuras

| Elemento C++ | Tipo | Propósito en C++ | Equivalente TypeScript / React Native |
| :--- | :--- | :--- | :--- |
| `GameState` | `enum class` | `MainMenu`, `SelectDifficulty`, `SelectTurn`, `Playing`, `GameOver`, `Analysis` | `types/game.ts` (`enum GameState` o React Navigation Screens) |
| `BoardType` | `enum class` | `TicTacToe3x3`, `Connect4x4`, `Gravity4x4`, `TicTacToe3D`, `TicTacToe4D` | `types/board.ts` (`enum BoardType`) |
| `GameMode` | `enum class` | `PvP` (Local), `PvCPU` (vs IA), `CPUvCPU` (Espectador) | `types/game.ts` (`enum GameMode`) |
| `PlayerTurnOrder` | `enum class` | `First` (Humano X), `Second` (Humano O, CPU inicia) | `types/game.ts` (`enum PlayerTurnOrder`) |
| `CellState` | `enum class` | `Empty = ' '`, `X = 'X'`, `O = 'O'` | `types/board.ts` (`type CellSymbol = 'X' \| 'O' \| ' '`) |
| `Difficulty` | `enum class` | `Easy`, `Medium`, `Hard` | `types/ai.ts` (`enum Difficulty`) |
| `MoveQuality` | `enum class` | `Best` (100%), `Good` (80%), `Inaccuracy` (50%), `Mistake` (25%), `Blunder` (0%) | `types/review.ts` (`enum MoveQuality`) |
| `Vector4i` | `struct` | Coordenada 4D `{x, y, z, w}` con operadores `==` y `!=` | `types/board.ts` (`interface Vector4i { x: number; y: number; z: number; w: number }`) |
| `MoveRecord` | `struct` | Registro histórico de cada movimiento `{symbol, pos}` | `types/review.ts` (`interface MoveRecord`) |
| `MoveAnalysis` | `struct` | Calidad, badge, color, comentario, tip y jugada sugerida | `types/review.ts` (`interface MoveAnalysis`) |
| `Score` | `struct` | Victorias X, Victorias O y Empates | `types/game.ts` (`interface Score`) + AsyncStorage |
| `Board` | `class` | Matriz 2D/3D/4D, detección de líneas, gravedad, chequeo de victoria | `game/board/BoardManager.ts` (Lógica pura agnóstica de UI) |
| `AI` | `class` | Minimax, poda Alfa-Beta, heurísticas para las 5 modalidades | `game/ai/AIEngine.ts` (Asíncrono / Web Worker / Microtareas) |
| `Player` | `class` | Nombre, símbolo ('X' / 'O'), tipo (Human / CPU), color | `types/player.ts` (`interface Player`) |
| `Game` | `class` | Orquestador de partida, temporizador CPU, Game Review | `stores/useGameStore.ts` (Zustand) |
| `Menu` | `class` | Pantallas de configuración, dificultad y turnos | Pantallas React Navigation (`HomeScreen`, `BoardSelectionScreen`, etc.) |
| `Button` | `class` | Botón interactivo con hover y transiciones de color | `components/common/GameButton.tsx` (Pressable + Reanimated) |
| `SoundManager`| `class` | Síntesis sinusoidal y reproducción de WAVs | `services/AudioService.ts` (Expo AV + sintetizador Web Audio / Data URIs) |
| `Config::Colors`| `namespace`| Paleta Dark Minimalist (Dark Slate, Neon Cyan, Coral, etc.) | `constants/theme.ts` (`Colors`) |

---

## 3. Especificación Matemática y Reglas de las 5 Modalidades

### 3.1. Modalidad 1: Tres en Raya Clásico (`TicTacToe3x3`)
- **Dimensiones:** Matriz $3 \times 3$ (9 casillas).
- **Condición de victoria:** 3 fichas consecutivas.
- **Líneas ganadoras (8):**
  - 3 Filas horizontales: `(r,0)-(r,1)-(r,2)` para $r \in [0..2]$.
  - 3 Columnas verticales: `(0,c)-(1,c)-(2,c)` para $c \in [0..2]$.
  - 2 Diagonales: `(0,0)-(1,1)-(2,2)` y `(0,2)-(1,1)-(2,0)`.
- **IA (Hard):** Minimax completo imbatible con poda Alfa-Beta. Aperturas óptimas en centro `(1,1)` y 4 esquinas.

### 3.2. Modalidad 2: Cuatro en Raya Libre (`Connect4x4`)
- **Dimensiones:** Matriz $4 \times 4$ (16 casillas).
- **Colocación:** Libre en cualquier casilla vacía disponible.
- **Condición de victoria:** 4 fichas consecutivas.
- **Líneas ganadoras (10):**
  - 4 Filas horizontales: `(r,0)-(r,1)-(r,2)-(r,3)` para $r \in [0..3]$.
  - 4 Columnas verticales: `(0,c)-(1,c)-(2,c)-(3,c)` para $c \in [0..3]$.
  - 2 Diagonales mayores: `(0,0)-(1,1)-(2,2)-(3,3)` y `(0,3)-(1,2)-(2,1)-(3,0)`.
- **IA (Hard):**
  - Detección inmediata de victoria y bloqueo inminente.
  - Aperturas preferentes en el cuadrado central `(1,1)`, `(1,2)`, `(2,1)`, `(2,2)`.
  - Minimax con profundidad acotada ($depth = 3$) y evaluación heurística de líneas (`evaluateBoard4x4`). Ponderación: 4 fichas = $\pm 10000$, 3 fichas = $\pm 100/120$, 2 fichas = $\pm 10/12$, 1 ficha = $\pm 1$, control central = $\pm 4$.

### 3.3. Modalidad 3: Cuatro en Raya con Gravedad (`Gravity4x4`)
- **Dimensiones:** Matriz $4 \times 4$ (16 casillas).
- **Mecánica:** Estilo Conecta 4. El jugador selecciona una columna ($c \in [0..3]$) y la ficha cae por gravedad hasta la fila más baja desocupada (`getLowestAvailableRow(c)`).
- **Condición de victoria:** 4 fichas consecutivas (horizontal, vertical o diagonal).
- **Líneas ganadoras:** Mismas 10 líneas que el 4x4 libre.
- **IA (Hard):**
  - Minimax a profundidad 6 ($depth = 6$) gracias al factor de ramificación reducido ($\le 4$ opciones por turno).
  - Ordenación de columnas evaluadas: `[1, 2, 0, 3]` (columnas centrales primero para maximizar podas Alfa-Beta).
  - Bonificación posicional de $+6$ por ficha en columnas 1 y 2.
  - En dificultad Media: filtro contra "columnas suicidas" (evita colocar una ficha si la casilla inmediatamente superior permite ganar al oponente en el siguiente turno).

### 3.4. Modalidad 4: Tres en Raya 3D / Qubic (`TicTacToe3D`)
- **Dimensiones:** Cubo $3 \times 3 \times 3$ (27 casillas distribuidas en 3 capas/pisos $Z \in [0..2]$).
- **Condición de victoria:** 3 fichas consecutivas en el espacio 3D.
- **Total de Líneas Ganadoras:** **Exactamente 49 líneas**:
  1. *9 Filas axiales por capa:* `(z, r, 0)-(z, r, 1)-(z, r, 2)` ($3 \times 3 = 9$).
  2. *9 Columnas axiales por capa:* `(z, 0, c)-(z, 1, c)-(z, 2, c)` ($3 \times 3 = 9$).
  3. *9 Pilares verticales intercapa:* `(0, r, c)-(1, r, c)-(2, r, c)` ($3 \times 3 = 9$).
  4. *6 Diagonales en planos XY:* 2 por cada piso $Z$.
  5. *6 Diagonales en planos XZ:* 2 por cada fila $R$.
  6. *6 Diagonales en planos YZ:* 2 por cada columna $C$.
  7. *4 Diagonales espaciales 3D que cruzan el centro `(1,1,1)`:*
     - `(0,0,0)-(1,1,1)-(2,2,2)`
     - `(0,0,2)-(1,1,1)-(2,2,0)`
     - `(0,2,0)-(1,1,1)-(2,0,2)`
     - `(0,2,2)-(1,1,1)-(2,0,0)`
- **IA (Hard):**
  - Ocupación prioritaria del centro absoluto `(1,1,1)` (+35 pts).
  - Bonificación por las 8 esquinas del cubo (+8 pts c/u).
  - Minimax profundidad 2 con evaluación heurística de 49 líneas (`evaluateBoard3D`).

### 3.5. Modalidad 5: Tres en Raya 4D / Teseracto (`TicTacToe4D`)
- **Dimensiones:** Hipercubo $3 \times 3 \times 3 \times 3$ (**81 casillas**). Coordenadas $(x, y, z, w)$ donde:
  - $w \in [0..2]$ representa el **Universo** (Macro-columna).
  - $z \in [0..2]$ representa el **Piso** dentro de ese universo (Macro-fila).
  - $x \in [0..2], y \in [0..2]$ representa la casilla $3 \times 3$ interna.
- **Condición de victoria:** 3 fichas en línea en el hiperespacio 4D.
- **Total de Líneas Ganadoras:** **Exactamente 272 líneas**:
  - Fórmula matemática: En una cuadrícula $k^n$ con $k=3, n=4$: $\frac{(k+2)^n - k^n}{2} = \frac{5^4 - 3^4}{2} = \frac{625 - 81}{2} = \mathbf{272}$.
  - Desglose: 108 axiales 1D + 108 diagonales planares 2D + 48 diagonales espaciales 3D + 8 hiperdiagonales 4D que cruzan el hipercentro `(1,1,1,1)`.
- **Generador Formal en el Código:**
  Recorre todos los vectores de dirección $(dx, dy, dz, dw) \in \{-1, 0, 1\}^4 \setminus \{(0,0,0,0)\}$ asegurando que el primer componente no nulo sea $> 0$, calculando los puntos de inicio válidos y proyectando $\vec{p}, \vec{p}+\vec{d}, \vec{p}+2\vec{d}$.
- **IA (Hard):**
  - Detección instantánea de victoria o bloqueo en las 272 líneas.
  - Ocupación prioritaria del hipercentro `(1,1,1,1)` (+40 pts).
  - Minimax de profundidad 1 con evaluación completa de las 272 líneas (`evaluateBoard4D`).

---

## 4. Sistema de Game Review (Análisis de Partida y Precisión)

El sistema de análisis reproduce la partida jugada paso a paso y la somete al motor de IA en dificultad `Hard`:

### 4.1. Algoritmo de Calificación de Jugadas (`MoveQuality`)
Para cada movimiento $i$ del historial con jugador activo $P$ y oponente $O$:
1. **Mejor Jugada (`Best`, 100% precisión - Verde `#00E676`):**
   - El movimiento realizado completó una victoria inmediata; O
   - El oponente tenía una amenaza de victoria inmediata y el jugador la bloqueó exactamente; O
   - El movimiento coincide con el mejor movimiento devuelto por Minimax (`bestPos`).
2. **Pifia Grave (`Blunder`, 0% precisión - Rojo `#FF1744`):**
   - El jugador omitió una victoria inmediata que sí lograba `bestPos`; O
   - El oponente tenía una amenaza de victoria inminente y el jugador NO la bloqueó.
3. **Error Táctico (`Mistake`, 25% precisión - Naranja `#FF9100`):**
   - La casilla jugada le regala una victoria inmediata al oponente en el siguiente turno (`createsLoss == true`).
4. **Buena Jugada (`Good`, 80% precisión - Cian `#00E5FF`):**
   - Cualquier otra jugada segura que mantenga la posición equilibrada.
5. **Imprecisión (`Inaccuracy`, 50% precisión - Ámbar `#FFD700`):**
   - Sub-óptima pero no perdedora inmediata.

### 4.2. Cálculo de Precisión Global
$$\text{Precisión}_P = \frac{\sum_{m \in \text{jugadas de } P} \text{precisión}(m)}{\text{total jugadas de } P}$$
Muestra barras de progreso con porcentaje numérico para Jugador X y Jugador O.

### 4.3. Sugerencia Visual de la IA
En cualquier jugada analizada, si la jugada no fue la óptima, la casilla recomendada `suggestedMove` se resalta con un borde verde esmeralda (`#00E676`). En 3D y 4D se indican además las coordenadas textuales (`Piso Z, Fila R, Col C` o `Cubo (W,Z) [X,Y]`).

---

## 5. Diseño Móvil, UI/UX y Estética Futurista

### 5.1. Paleta de Colores Oficial
- **Fondo General (`Background`):** `#141721` (Dark Slate profundo)
- **Superficie Tablero (`BoardSurface`):** `#1c212f`
- **Borde Tablero (`BoardBorder`):** `#2a3144`
- **Casilla Reposo (`CellNormal`):** `#23293a`
- **Casilla Activa / Hover (`CellHover`):** `#30384f`
- **Borde Casilla (`CellBorder`):** `#374058`
- **Ficha X (`PlayerX`):** `#00d4ff` (Neon Cyan)
- **Ficha O (`PlayerO`):** `#ff4d79` (Coral / Pink vibrante)
- **Línea Ganadora (`WinLine`):** `#ffd700` (Dorado resplandeciente)
- **Sugerencia IA (`SuggestedCell`):** `#00e676` (Verde Esmeralda translúcido)

### 5.2. Adaptación de Visualización para Pantallas Táctiles

1. **Tablero 2D (3x3 y 4x4 Libre):**
   - Cuadrícula centrada responsiva (ancho del 90% de pantalla con tamaño máximo acotado).
   - Animación de escala/desvanecimiento con `react-native-reanimated`.
   - Línea ganadora SVG / Reanimated sobre las celdas vencedoras.

2. **Tablero 4x4 con Gravedad:**
   - Detección de columna táctil por área vertical completa.
   - Previsualización traslúcida (*ghost token*) de la celda de aterrizaje.
   - Animación de caída con física *bounce* (`easeOutBounce`) desde la parte superior hasta la celda destino.

3. **Tablero 3D (3x3x3 = 27 casillas):**
   - **Solución Móvil de Primera Clase:**
     - Selector de Piso interactivo con pestañas / pills: `PISO 1 (SUPERIOR)`, `PISO 2 (MEDIO)`, `PISO 3 (INFERIOR)` o vista apilada vertical / isométrica con scroll suave.
     - Indicador continuo de coordenadas seleccionadas `(X, Y, Z)`.
     - Resaltado inter-piso: Cuando una línea ganadora o sugerencia cruza múltiples pisos, se muestra un indicador visual en las pestañas de los otros pisos afectados y una vista expandida tipo "Cubo desplegado".

4. **Tablero 4D (Teseracto 81 casillas):**
   - **Solución Móvil Intuitiva:**
     - Macro-selector jerárquico táctil:
       - Fila superior de Universos: `[ W1 ]  [ W2 ]  [ W3 ]`
       - Fila de Pisos: `[ Z1 ]  [ Z2 ]  [ Z3 ]`
       - Tablero táctil $3 \times 3$ del universo y piso seleccionados.
     - Botón de cambio a vista global "Macro-Matriz 3x3 de universos" con scroll horizontal fluido.
     - Telemetría en tiempo real: muestra `(X, Y, Z, W)` y número de líneas ganadoras que cruzan por dicha casilla.
     - En victoria hiperdimensional: Secuencia animada que recorre los universos y pisos ganadores con telemetría de coordenadas.

---

## 6. Arquitectura del Proyecto Móvil (`src/`)

```text
tres-en-raya-mobile/
├── App.tsx                     # Configuración de Providers, StatusBar, Fonts y NavigationContainer
├── app.json                    # Configuración de Expo (nombre, slug, orientación portrait, splash, icons)
├── package.json                # Dependencias (expo, react-native, zustand, reanimated, etc.)
├── tsconfig.json               # Configuración estricta de TypeScript con path aliases (@/*)
├── assets/                     # Iconos, splash y sonidos sintéticos
│   ├── icon.png
│   ├── splash.png
│   └── sounds/
├── src/
│   ├── constants/
│   │   ├── colors.ts           # Paleta oficial (Dark Slate, Neon Cyan, Coral, etc.)
│   │   ├── layout.ts           # Medidas responsivas y espaciados
│   │   └── timing.ts           # Duraciones de animaciones y retardo de CPU (~450ms)
│   ├── types/
│   │   ├── board.ts            # BoardType, Vector4i, CellSymbol, Grid2D, Grid3D, Grid4D
│   │   ├── game.ts             # GameState, GameMode, PlayerTurnOrder, Score, GameConfig
│   │   ├── ai.ts               # Difficulty, MoveResult, HeuristicWeights
│   │   ├── player.ts           # PlayerType, Player
│   │   └── review.ts           # MoveRecord, MoveAnalysis, MoveQuality
│   ├── game/
│   │   ├── board/
│   │   │   ├── BoardModel.ts   # Estado y mutaciones puras 2D, 3D, 4D (agnóstico de UI)
│   │   │   ├── GravityPhysics.ts # Cálculo de caída en columnas
│   │   │   └── WinningLines.ts # Generación y memoización de 8 (3x3), 10 (4x4), 49 (3D) y 272 (4D) líneas
│   │   ├── ai/
│   │   │   ├── Minimax3x3.ts   # Minimax puro para 3x3
│   │   │   ├── Minimax4x4.ts   # Minimax acotado + evaluación para 4x4 libre
│   │   │   ├── MinimaxGravity.ts # Minimax depth 6 + ordenación de columnas para gravedad
│   │   │   ├── Minimax3D.ts    # Minimax depth 2 + centro (1,1,1) para 3D
│   │   │   ├── Minimax4D.ts    # Minimax depth 1 + hipercentro (1,1,1,1) para 4D
│   │   │   └── AIEngine.ts     # Fachada unificada con dificultades (Easy, Medium, Hard) y asincronía
│   │   └── review/
│   │       ├── ReviewEngine.ts # Evaluación jugada a jugada, cálculo de precisión y clasificación
│   │       └── CommentaryGenerator.ts # Generador didáctico de explicaciones y tips
│   ├── stores/
│   │   ├── useGameStore.ts     # Estado de partida activa, turnos, historial, resultado
│   │   ├── useSettingsStore.ts # Configuración (sonido, vibración, dificultad por modalidad)
│   │   └── useStatsStore.ts    # Victorias, derrotas, empates, precisión promedio con AsyncStorage
│   ├── services/
│   │   ├── AudioService.ts     # Reproductor de audio con Expo AV / Web Audio procedimental
│   │   ├── HapticService.ts    # Integración con Expo Haptics
│   │   └── StorageService.ts   # Envoltura sobre AsyncStorage con claves tipadas
│   ├── components/
│   │   ├── common/
│   │   │   ├── GameButton.tsx  # Botón con efecto glow, hover y feedback háptico
│   │   │   ├── GameCard.tsx    # Tarjeta de superficie elevada con borde sutil
│   │   │   ├── SegmentedControl.tsx # Selector de opciones tipo pill
│   │   │   ├── ModalOverlay.tsx # Modal oscuro semitransparente
│   │   │   └── Badge.tsx       # Insignia de dificultad / turno / estado
│   │   ├── board/
│   │   │   ├── Board2D.tsx     # Tablero para 3x3 y 4x4 libre
│   │   │   ├── BoardGravity.tsx # Tablero con guías de columna y animación de caída
│   │   │   ├── Board3D.tsx     # Tablero 3D con selector de pisos o proyección multicapa
│   │   │   ├── Board4D.tsx     # Tablero 4D con macro-matriz W x Z y selector táctil
│   │   │   ├── Cell2D.tsx      # Casilla individual con animación Reanimated de ficha
│   │   │   └── WinningLineOverlay.tsx # Trazado luminoso de línea de victoria
│   │   ├── game/
│   │   │   ├── ScoreBoard.tsx  # Marcador persistente (X vs O y empates)
│   │   │   ├── TurnIndicator.tsx # Indicador visual de turno y estado "Pensando..." de CPU
│   │   │   └── Telemetry4D.tsx # Coordenadas (X, Y, Z, W) y líneas que cruzan la celda
│   │   └── review/
│   │       ├── ReviewCard.tsx  # Tarjeta de análisis con badge de calidad, comentario y tip
│   │       ├── AccuracyBar.tsx # Barra de progreso con precisión (%) de X y O
│   │       └── ReviewControls.tsx # Botones táctiles (Inicio, Anterior, Siguiente, Fin, Salir)
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Menú principal con fondo animado sutil de X y O
│   │   ├── BoardSelectScreen.tsx # Selector de las 5 modalidades con tarjetas ilustrativas
│   │   ├── GameModeScreen.tsx  # Selección de PvP, PvCPU (con turno X/O/Random) o CPUvCPU
│   │   ├── GameScreen.tsx      # Pantalla principal de juego activa
│   │   ├── ResultModal.tsx     # Diálogo de fin de partida (Revancha, Analizar, Menú)
│   │   ├── ReviewScreen.tsx    # Pantalla de análisis jugada a jugada
│   │   ├── StatisticsScreen.tsx # Estadísticas detalladas de partidas por modalidad
│   │   ├── SettingsScreen.tsx  # Configuración (Sonido, Vibración, Dificultades, Reiniciar)
│   │   └── AboutScreen.tsx     # Información del proyecto e inspiraciones dimensionales
│   └── navigation/
│       └── AppNavigator.tsx    # Stack Navigator de React Navigation con transiciones suaves
└── __tests__/
    ├── WinningLines.test.ts    # Validación estricta: 8 líneas (3x3), 10 (4x4), 49 (3D), 272 (4D)
    ├── BoardModel.test.ts      # Movimientos, gravedad, detección de victoria y empate
    ├── AIEngine.test.ts        # Comportamiento Easy, Medium, Hard, bloqueo y aperturas
    └── ReviewEngine.test.ts    # Calificación de jugadas, precisión y detección de pifias
```

---

## 7. Plan de Ejecución por Fases

- **Fase 1: Análisis Exhaustivo (Completada):** Estudio completo de código fuente C++, algoritmos, 49 líneas 3D, 272 líneas 4D, heurísticas e interfaz.
- **Fase 2: Plan de Migración (Completada):** Presentación del documento `MIGRATION_PLAN.md` y aprobación.
- **Fase 3: Inicialización del Proyecto Expo + TypeScript:** Creación de configuración, dependencias (`zustand`, `react-native-reanimated`, `react-native-safe-area-context`, `@react-navigation/native`, `@react-navigation/native-stack`, `expo-haptics`, `expo-av`, `@react-native-async-storage/async-storage`, `jest`, etc.).
- **Fase 4: Sistema de Diseño y Tokens:** `colors.ts`, `layout.ts`, fuentes, componentes reutilizables (`GameButton`, `GameCard`, `Badge`, `ModalOverlay`).
- **Fase 5: Motor de Lógica Pura (BoardModel & WinningLines):** Implementación de las 49 líneas 3D y 272 líneas 4D con validaciones matemáticas unitarias.
- **Fase 6: Motores de IA (AIEngine):** Minimax 3x3, 4x4, Gravedad, 3D y 4D con cálculo no bloqueante.
- **Fase 7: Navegación y Pantallas Principales:** `HomeScreen`, `BoardSelectScreen`, `GameModeScreen`, `AppNavigator`.
- **Fase 8: Modos 3x3 Clásico y 4x4 Libre:** Tablero 2D con animaciones de fichas X/O y trazado de victoria.
- **Fase 9: Modo 4x4 con Gravedad:** Detección de columnas, previsualización y animación de caída con rebote (`easeOutBounce`).
- **Fase 10: Modo 3D (Qubic):** Visualizador de pisos 3D con indicador de coordenadas $(X, Y, Z)$ y líneas 3D.
- **Fase 11: Modo 4D (Teseracto):** Visualizador hiperdimensional por universos $W$ y pisos $Z$ con telemetría $(X,Y,Z,W)$ y líneas ganadoras interdimensionales.
- **Fase 12: Sistema de Game Review:** Replay de partida, cálculo de precisión, clasificación de jugadas y resaltado de la celda sugerida en verde esmeralda (`#00E676`).
- **Fase 13: Marcador, Estadísticas y Persistencia:** `useStatsStore` respaldado en AsyncStorage.
- **Fase 14: Audio, Haptics y Micro-Animaciones:** `AudioService` (sintetizador de tonos y arpegios), `HapticService` (`expo-haptics`) y efectos visuales.
- **Fase 15: Pantallas de Configuración y Acerca De:** Control de audio, vibración y dificultades individuales.
- **Fase 16: Tests Unitarios y Verificación:** Ejecución de tests en Jest para verificar reglas, 49 líneas 3D, 272 líneas 4D, IA y Game Review.
- **Fase 17: Documentación y Verificación en Expo:** Creación del nuevo `README.md` y comprobación de ejecución.
