/**
 * Oráculo matemático de valoración — Ecuaciones 1 a 6 y 11.
 * Fuente: docs/MOTOR_MATEMATICO_COMPLETO.md
 *
 * Nota sobre el multiplicador de racha: el documento incluye tanto una fórmula
 * (M = 1 + J/10) como una TABLA escalonada. Los 4 ejemplos de validación del
 * documento (Courtois, Haaland, Van Dijk, Ter Stegen) usan la TABLA, así que
 * implementamos la tabla y validamos contra esos ejemplos.
 */

import type { Competition, MatchStats, OracleResult, Position } from "./types";

/** Constante de normalización K (freno) — Ecuación 2. */
export const K_NORMALIZATION = 15;

/** Tope de R_match antes de multiplicadores (±5%). */
export const PERFORMANCE_CAP = 0.05;

/** Tope final del cambio de precio después de aplicar todos los multiplicadores (±10%). */
export const FINAL_CHANGE_CAP = 0.10;

/** Límites de seguridad del precio del token (Ecuación 1). */
export const PRICE_MIN = 0.5;
export const PRICE_MAX = 500;

/** Penalización extra cuando el rendimiento es muy malo (R_match ≤ -0.04). */
export const BAD_PERFORMANCE_THRESHOLD = -0.04;
export const BAD_PERFORMANCE_PENALTY = -0.01;

/** Puntuación base esperada por posición S_base (Ecuación 2). */
export const BASE_SCORE: Record<Position, number> = {
  GK: 5.0,
  DF: 5.5,
  MD: 6.5,
  FW: 7.0,
};

/** Multiplicador de competición M_comp (Ecuación 6). */
export const COMPETITION_MULTIPLIER: Record<Competition, number> = {
  LIGA: 1.0,
  COPA: 1.1,
  EUROPA_LEAGUE: 1.2,
  LIBERTADORES: 1.3,
  MUNDIAL_CLUBES: 1.4,
  CHAMPIONS: 1.5,
};

/** Bono adicional para eliminatorias directas (semifinales/finales). */
export const KNOCKOUT_BONUS = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function n(value: number | undefined): number {
  return value ?? 0;
}

/**
 * Ecuación 3 — Puntaje bruto S_raw según la posición.
 * Las tarjetas (amarilla -1.0, roja -3.0) aplican a todas las posiciones
 * según la matriz de la Ecuación 4.
 */
export function rawScore(position: Position, stats: MatchStats): number {
  const cleanSheet = stats.cleanSheet ? 1 : 0;
  let score: number;

  switch (position) {
    case "GK":
      score =
        0.8 * n(stats.saves) +
        5.0 * n(stats.penaltySaves) +
        4.0 * cleanSheet +
        8.0 * n(stats.goals) +
        5.0 * n(stats.assists) -
        1.5 * n(stats.goalsConceded);
      break;
    case "DF":
      score =
        6.0 * n(stats.goals) +
        4.5 * n(stats.assists) +
        3.5 * cleanSheet +
        0.4 * n(stats.recoveries) +
        0.3 * n(stats.clearances) -
        1.0 * n(stats.goalsConceded);
      break;
    case "MD":
      score =
        4.5 * n(stats.goals) +
        3.5 * n(stats.assists) +
        1.0 * cleanSheet +
        0.4 * n(stats.keyPasses) +
        0.3 * n(stats.recoveries);
      break;
    case "FW":
      score =
        3.5 * n(stats.goals) +
        2.5 * n(stats.assists) +
        0.5 * n(stats.shotsOnTarget) +
        0.3 * n(stats.keyPasses);
      break;
  }

  // Penalizaciones universales por tarjetas (Ecuación 4).
  score += -1.0 * n(stats.yellowCards) + -3.0 * n(stats.redCards);
  return score;
}

/**
 * Ecuación 2 — Rendimiento de jornada R_match, con el tope ±0.15 aplicado.
 */
export function matchPerformance(rawScoreValue: number, position: Position): number {
  const raw = (rawScoreValue - BASE_SCORE[position]) / K_NORMALIZATION;
  return clamp(raw, -PERFORMANCE_CAP, PERFORMANCE_CAP);
}

/**
 * Ecuación 5 — Multiplicador de racha M_streak (tabla escalonada).
 * @param consecutive Jornadas consecutivas con R_match positivo.
 */
export function streakMultiplier(consecutive: number): number {
  if (consecutive <= 0) return 1.0;
  if (consecutive <= 2) return 1.1;
  if (consecutive <= 4) return 1.2;
  if (consecutive <= 6) return 1.3;
  if (consecutive <= 8) return 1.5;
  return 2.0;
}

/**
 * Actualiza el contador de racha tras un partido (reglas de la Ecuación 5).
 * @returns Las nuevas jornadas consecutivas.
 */
export function updateStreak(previousStreak: number, performance: number): number {
  return performance > 0 ? previousStreak + 1 : 0;
}

/**
 * Ecuación 6 — Multiplicador de competición M_comp.
 * @param isKnockout true en semifinales/finales (suma +0.25).
 */
export function competitionMultiplier(competition: Competition, isKnockout = false): number {
  const base = COMPETITION_MULTIPLIER[competition];
  return isKnockout ? base + KNOCKOUT_BONUS : base;
}

/**
 * Ecuación 1 — Precio del token P_t, acotado a [PRICE_MIN, PRICE_MAX].
 * El cambio porcentual se limita a ±FINAL_CHANGE_CAP (10%) antes de aplicarse.
 */
export function tokenPrice(
  anchor: number,
  performance: number,
  compMult: number,
  streakMult: number,
): number {
  const rawChange = performance * compMult * streakMult;
  const cappedChange = clamp(rawChange, -FINAL_CHANGE_CAP, FINAL_CHANGE_CAP);
  const raw = anchor * (1 + cappedChange);
  return clamp(raw, PRICE_MIN, PRICE_MAX);
}

/**
 * Calcula la calificación global suavizada del jugador ("fundido" o EMA).
 * @param previousGlobal Calificación global de la jornada anterior.
 * @param newMatchRating Calificación del partido de la nueva jornada.
 * @param alpha Factor de suavizado (por defecto 0.3, es decir, 30% nuevo y 70% inercia).
 */
export function calculateGlobalRating(
  previousGlobal: number,
  newMatchRating: number,
  alpha = 0.3,
): number {
  if (!previousGlobal || previousGlobal <= 0) {
    return newMatchRating;
  }
  return Number((alpha * newMatchRating + (1 - alpha) * previousGlobal).toFixed(1));
}

/** Entrada completa para ejecutar el oráculo sobre un partido. */
export interface OracleInput {
  position: Position;
  anchor: number;
  stats: MatchStats;
  competition: Competition;
  isKnockout?: boolean;
  /** Racha previa (jornadas consecutivas positivas antes de este partido). */
  previousStreak?: number;
}

/**
 * Ejecuta el oráculo completo para un partido y devuelve el desglose.
 * Encadena Ecuaciones 3 → 2 → 5 → 6 → 1, y añade la calificación 0-100.
 */
export function runOracle(input: OracleInput): OracleResult {
  const { position, anchor, stats, competition, isKnockout = false, previousStreak = 0 } = input;

  const raw = rawScore(position, stats);
  let performance = matchPerformance(raw, position);

  // Penalización extra por rendimiento muy malo.
  if (performance <= BAD_PERFORMANCE_THRESHOLD) {
    performance = Math.max(-PERFORMANCE_CAP, performance + BAD_PERFORMANCE_PENALTY);
  }

  const newStreak = updateStreak(previousStreak, performance);
  // El multiplicador de racha premia la racha CON LA QUE LLEGA el jugador al
  // partido (racha previa). Si el rendimiento no es positivo, la racha se
  // resetea y el multiplicador es 1.0. Esto reproduce los 4 ejemplos del doc
  // (p. ej. Haaland con racha 0 → ×1.0, no ×1.1).
  const sMult = performance > 0 ? streakMultiplier(previousStreak) : 1.0;
  const cMult = competitionMultiplier(competition, isKnockout);
  const price = tokenPrice(anchor, performance, cMult, sMult);

  // Cálculo de la calificación de jornada en escala 0-100 (SofaScore style)
  // Rendimiento sin tope (uncapped performance) para mapeo visual completo:
  const uncappedPerformance = (raw - BASE_SCORE[position]) / K_NORMALIZATION;
  const rawRating = 70 + 60 * uncappedPerformance;
  const matchRating = clamp(Number(rawRating.toFixed(1)), 0, 100);

  return {
    rawScore: raw,
    baseScore: BASE_SCORE[position],
    performance,
    compMultiplier: cMult,
    streakMultiplier: sMult,
    newStreak,
    price,
    changePct: ((price - anchor) / anchor) * 100,
    matchRating,
  };
}

