/**
 * Tipos compartidos del motor matemático "Playrs".
 * Basado en docs/MOTOR_MATEMATICO_COMPLETO.md
 */

/** Posición del jugador (determina la fórmula de puntaje y la base esperada). */
export type Position = "GK" | "DF" | "MD" | "FW";

/** Competiciones soportadas con su multiplicador asociado (Ecuación 6). */
export type Competition =
  | "LIGA" // Liga local — base ×1.0
  | "COPA" // Copa nacional ×1.1
  | "EUROPA_LEAGUE" // ×1.2
  | "LIBERTADORES" // ×1.3
  | "MUNDIAL_CLUBES" // ×1.4
  | "CHAMPIONS"; // ×1.5

/**
 * Estadísticas brutas de un jugador en un partido.
 * Todas las métricas son opcionales; las no provistas cuentan como 0.
 */
export interface MatchStats {
  /** Goles anotados */
  goals?: number;
  /** Asistencias */
  assists?: number;
  /** Atrapadas / paradas (portero) */
  saves?: number;
  /** Penales atajados (portero) */
  penaltySaves?: number;
  /** Valla invicta: true si el equipo no recibió goles */
  cleanSheet?: boolean;
  /** Tiros a puerta (delantero) */
  shotsOnTarget?: number;
  /** Pases clave */
  keyPasses?: number;
  /** Balones recuperados */
  recoveries?: number;
  /** Despejes (defensa) */
  clearances?: number;
  /** Goles concedidos (portero/defensa) */
  goalsConceded?: number;
  /** Tarjetas amarillas */
  yellowCards?: number;
  /** Tarjetas rojas */
  redCards?: number;
}

/** Resultado completo del cálculo del oráculo para un partido. */
export interface OracleResult {
  /** Puntaje bruto S_raw (Ecuación 3) */
  rawScore: number;
  /** Puntuación base esperada por posición S_base */
  baseScore: number;
  /** Rendimiento de jornada R_match, ya con el tope ±0.15 aplicado (Ecuación 2) */
  performance: number;
  /** Multiplicador de competición M_comp (Ecuación 6) */
  compMultiplier: number;
  /** Multiplicador de racha M_streak (Ecuación 5) */
  streakMultiplier: number;
  /** Jornadas consecutivas resultantes tras este partido */
  newStreak: number;
  /** Precio resultante del token P_t (Ecuación 1), acotado a [0.5, 500] */
  price: number;
  /** Variación porcentual respecto al P_anchor */
  changePct: number;
  /** Calificación visual de la jornada en escala 0-100 */
  matchRating: number;
}

