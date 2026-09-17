# Roadmap de Implementación: Fases Restantes (9 a 12)
## Tres en Raya Mobile (React Native / Expo / C++17 Port)

Este documento detalla las especificaciones de arquitectura, diseño de datos, algoritmos de IA, interfaces de usuario y casos de prueba para implementar las fases pendientes de forma consistente con las optimizaciones del proyecto (`cells[300]`, indexación contigua $O(1)$, desacoplamiento de temporizadores y Game Review asíncrono).

---

## Índice de Fases Restantes

1. [Fase 9: Modalidad Tres Jugadores (`BoardType.ThreePlayers3x3`)](#fase-9-modalidad-tres-jugadores)
2. [Fase 10: Modalidad Poderes (`BoardType.Powers3x3` o Habilidades Tácticas)](#fase-10-modalidad-poderes-y-habilidades)
3. [Fase 11: Modo Laboratorio / Sandbox (Editor de Reglas Personalizadas)](#fase-11-modo-laboratorio--sandbox)
4. [Fase 12: Modo Campaña / Modo Aventura (Progresión de Niveles y Jefes)](#fase-12-modo-campaña--aventura)
5. [Guía de Integración y Buenas Prácticas](#guía-de-integración-y-buenas-prácticas)

---

## Fase 9: Modalidad Tres Jugadores

### 1. Resumen y Reglas
- **Tablero**: 3x3 clásico (9 casillas).
- **Participantes**: 3 jugadores identificados por los símbolos `'X'`, `'O'` e `'Y'`.
- **Rotación de Turnos**: Cíclica estricta: `X -> O -> Y -> X`.
- **Condición de Victoria**: El primer jugador que conecte 3 fichas de su símbolo en cualquier fila, columna o diagonal gana inmediatamente.
- **Empate**: Si las 9 casillas quedan ocupadas (3 fichas por jugador) sin una línea ganadora, la partida se declara empate.
- **Modos de Juego**:
  - `PvP`: 3 jugadores humanos en el mismo dispositivo pasando el turno.
  - `PvCPU`: 1 jugador humano ('X') contra 2 instancias de IA ('O' e 'Y') con niveles de dificultad configurables.
  - `CPUvCPU`: Modo espectador con 3 IAs compitiendo.

### 2. Cambios en Tipos y Constantes
1. **`src/types/board.ts`**:
   ```typescript
   export type CellSymbol = 'X' | 'O' | 'Y' | ' ' | '#';
   
   export enum BoardType {
     // ...
     ThreePlayers3x3 = 'ThreePlayers3x3',
   }
   ```
2. **`src/constants/colors.ts`**:
   ```typescript
   playerY: '#10b981', // Verde esmeralda neón vibrante (contraste óptimo con Cyan X y Pink O)
   ```
3. **`src/types/game.ts`**:
   ```typescript
   export interface Score {
     xWins: number;
     oWins: number;
     yWins?: number;
     draws: number;
   }
   
   export interface ModeStats {
     played: number;
     xWins: number;
     oWins: number;
     yWins?: number;
     draws: number;
     totalAccuracy: number;
     accuracyCount: number;
   }
   ```

### 3. Modelo de Tablero (`BoardModel.ts` y `WinningLines.ts`)
- **`WinningLines.ts`**:
  - Enlazar `BoardType.ThreePlayers3x3` para retornar `generateWinningLines3x3()`.
- **`BoardModel.ts`**:
  - Método helper: `isThreePlayers(): boolean { return this.type === BoardType.ThreePlayers3x3; }`
  - `isFull()`: Si `this.type === BoardType.ThreePlayers3x3`, retornar `this.occupiedCount >= 9`.
  - `checkWinner()`: La lógica actual ya evalúa si `first !== ' ' && first !== '#'`. Al soportar `'Y'`, detecta automáticamente victorias de `'Y'`.

### 4. Motor de IA: `MinimaxThreePlayers.ts`
El cálculo con 3 jugadores requiere un enfoque multi-agente heurístico o búsqueda Max-N podada:
```typescript
export function getBestMoveThreePlayers(
  board: BoardModel,
  aiSymbol: CellSymbol,
  allOpponents: CellSymbol[],
  difficulty: Difficulty
): Vector4i {
  // 1. Victoria inmediata de la IA: si una casilla completa 3 en raya para aiSymbol, jugar de inmediato (+10000)
  // 2. Bloqueo urgente al siguiente jugador: si el jugador que juega inmediatamente después tiene 2 en raya con casilla libre, bloquear (+5000)
  // 3. Bloqueo al tercer jugador: bloquear si tiene 2 en raya (+3000)
  // 4. Crear doble amenaza / tenedor (+1000)
  // 5. Control central (1,1) (+500) y esquinas (+200)
  // En dificultad Difícil: búsqueda recursiva Max-N hasta profundidad 3 (ejecuta en < 5ms dado que son <= 9 casillas).
}
```

### 5. Integración en Store y UI
- **`useGameStore.ts`**:
  - Rotación de turno:
    ```typescript
    const nextTurn = state.board.isThreePlayers()
      ? (curSymbol === 'X' ? 'O' : curSymbol === 'O' ? 'Y' : 'X')
      : (curSymbol === 'X' ? 'O' : 'X');
    ```
  - En `executeCpuTurnIfNeeded`: permitir que la CPU juegue tanto para `'O'` como para `'Y'` cuando el humano es `'X'`.
- **`Cell2D.tsx`**:
  - Aplicar `Colors.playerY` cuando `symbol === 'Y'`.
- **Pantallas**:
  - Registrar tarjeta en `BoardSelectScreen.tsx` ("3 JUGADORES 3x3").
  - Mapear nombres en `SettingsScreen.tsx`, `StatisticsScreen.tsx` y `AboutScreen.tsx`.

---

## Fase 10: Modalidad Poderes y Habilidades

### 1. Resumen y Reglas
Partidas dinámicas en tablero 3x3 o 4x4 donde cada jugador dispone de un mazo o inventario de **Poderes Especiales de un solo uso por partida** (o con tiempo de recarga):
1. **💥 Bomba / Demolición**: Destruye cualquier ficha rival o propia en el tablero y vuelve a dejar la casilla vacía.
2. **🔄 Doble Turno**: Permite al jugador colocar 2 fichas consecutivas en su turno.
3. **🪨 Bloqueo Territorial**: Convierte una casilla vacía en un obstáculo infranqueable temporal (1 ronda) o permanente.
4. **🔀 Intercambio Cuántico**: Intercambia de posición dos fichas opuestas existentes en el tablero.

### 2. Diseño de Datos y Tipos
Crear `src/types/powers.ts`:
```typescript
export enum PowerType {
  Bomb = 'Bomb',
  DoubleTurn = 'DoubleTurn',
  BlockCell = 'BlockCell',
  Swap = 'Swap',
}

export interface PlayerPowers {
  bombUsed: boolean;
  doubleTurnUsed: boolean;
  blockCellUsed: boolean;
  swapUsed: boolean;
}
```

### 3. Modelo y Ejecución en `BoardModel.ts`
- Métodos específicos:
  - `clearCell(pos: Vector4i): boolean` (para bomba).
  - `swapCells(posA: Vector4i, posB: Vector4i): boolean` (para intercambio).
  - `setObstacleCell(pos: Vector4i): boolean` (para bloqueo).
- Soporte en `undoStack` para deshacer poderes con precisión.

### 4. Componente UI: `PowerBar.tsx`
- Barra flotante debajo del tablero con los iconos de los poderes disponibles.
- Estado activo para seleccionar el poder antes de tocar la casilla objetivo.
- Animación de partículas o destellos de Reanimated al activar un poder.

---

## Fase 11: Modo Laboratorio / Sandbox

### 1. Resumen
Un creador y editor interactivo de partidas personalizadas donde el jugador puede configurar y experimentar con todas las variables del motor físico y matemático:
- **Dimensiones de Tablero**: Selección libre entre 3x3, 4x4, 5x5, 3D (3x3x3) y 4D.
- **Fichas en Línea para Ganar**: 3, 4 o 5 consecutivas.
- **Física de Gravedad**: Activada / Desactivada.
- **Regla de Desvanecimiento (FIFO)**: Ilimitada, o con límite de 3, 4 o 5 fichas activas por jugador.
- **Regla Misère**: Activada (quien forma línea pierde) o Normal.
- **Densidad de Obstáculos**: 0 a 5 piedras aleatorias generadas en el tablero.
- **Temporizador**: Sin límite, 3s, 5s, 10s o 15s por jugada.
- **Participantes**: 2 jugadores o 3 jugadores.

### 2. Estructura de Archivos
- `src/screens/LabScreen.tsx`: Pantalla con controles deslizantes (`Sliders`), interruptores (`Switches`) y selector visual de reglas.
- `src/types/lab.ts`: Definición de `CustomGameRules`.
- `src/game/board/CustomBoardModel.ts` o extensión de `BoardModel`: inicialización dinámica basada en el objeto de configuración.
- Capacidad de exportar / compartir configuraciones mediante códigos alfanuméricos cortos (Semillas).

---

## Fase 12: Modo Campaña / Aventura

### 1. Resumen y Estructura de Mundos
Modo para un jugador con progresión lineal a través de mundos temáticos. Cada nivel cuenta con modificadores únicos, diálogos breves con oponentes temáticos y metas secundarias para ganar hasta 3 estrellas:
- **Mundo 1: El Origen (3x3 Clásico)**:
  - Nivel 1: Tres en raya clásico (Tutorial avanzado).
  - Nivel 2: Regla Misère obligatoria.
  - Nivel 3: Fichas Limitadas (3 máx).
  - Jefe 1: *El Cronometrador* (Contrarreloj de 3 segundos por turno).
- **Mundo 2: Las Cuatro Direcciones (Tableros 4x4)**:
  - Nivel 4: 4x4 Libre con búsqueda territorial.
  - Nivel 5: 4x4 con Gravedad Connect.
  - Nivel 6: 4x4 con Obstáculos procedurales.
  - Jefe 2: *El Cantero* (Obstáculos dinámicos y fichas limitadas).
- **Mundo 3: Caos y Dimensiones**:
  - Nivel 7: Tres Jugadores simultáneos.
  - Nivel 8: 3D Qubic (Cubo 3x3x3).
  - Nivel 9: Teseracto Hiperdimensional 4D.
  - Jefe 3: *El Arquitecto* (Ultimate Tic-Tac-Toe en dificultad Máxima).

### 2. Estado de Progresión: `useCampaignStore.ts`
- Persistencia local en `AsyncStorage` / `StorageService`:
  ```typescript
  export interface CampaignLevelProgress {
    levelId: number;
    unlocked: boolean;
    completed: boolean;
    stars: number; // 0 a 3
    highScore: number;
  }
  ```
- Pantalla de selección de niveles con mapa deslizable (`CampaignMapScreen.tsx`) y tarjeta de resumen del nivel antes de comenzar.

---

## Guía de Integración y Buenas Prácticas

1. **Rendimiento y Zero-Allocation**:
   - Mantener el array plano contiguo `cells[300]` en `BoardModel`.
   - Utilizar las líneas ganadoras precomputadas en `WinningLines.ts`.
2. **Game Review Asíncrono**:
   - Mantener el cálculo del Game Review en `setTimeout(50ms)` tras la victoria para que el modal de resultados aparezca con 0 ms de retraso visual.
3. **Verificación Continua**:
   - En cada fase, ejecutar `npm run typecheck` para asegurar 0 errores de TypeScript.
   - Correr la suite completa `npm test` verificando que todas las pruebas pasen y que las pruebas de rendimiento respeten las tolerancias de tiempo de CPU.
