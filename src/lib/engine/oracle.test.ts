import { describe, it, expect } from "vitest";
import {
  rawScore,
  matchPerformance,
  streakMultiplier,
  updateStreak,
  competitionMultiplier,
  tokenPrice,
  runOracle,
  calculateGlobalRating,
  K_NORMALIZATION,
  PERFORMANCE_CAP,
  BASE_SCORE,
  COMPETITION_MULTIPLIER,
} from "./oracle";
import type { MatchStats, Position, Competition } from "./types";
import { getCardValuation, getReferralBonusPercent } from "../../context/StoreContext";

describe("rawScore", () => {
  describe("Portero (GK)", () => {
    it("calcula puntaje básico de portero", () => {
      const stats: MatchStats = {
        saves: 6,
        penaltySaves: 1,
        cleanSheet: true,
        goalsConceded: 0,
      };
      const score = rawScore("GK", stats);
      // 6*0.8 + 1*5.0 + 1*4.0 - 0*1.5 = 4.8 + 5.0 + 4.0 = 13.8
      expect(score).toBe(13.8);
    });

    it("resta goles concedidos", () => {
      const stats: MatchStats = {
        saves: 3,
        goalsConceded: 2,
      };
      const score = rawScore("GK", stats);
      // 3*0.8 - 2*1.5 = 2.4 - 3.0 = -0.6
      expect(score).toBeCloseTo(-0.6, 5);
    });

    it("cuenta goles anotados por portero", () => {
      const stats: MatchStats = {
        goals: 1,
      };
      const score = rawScore("GK", stats);
      // 1*8.0 = 8.0
      expect(score).toBe(8.0);
    });
  });

  describe("Defensa (DF)", () => {
    it("calcula puntaje básico de defensa", () => {
      const stats: MatchStats = {
        goals: 1,
        assists: 1,
        cleanSheet: true,
        recoveries: 8,
        clearances: 5,
      };
      const score = rawScore("DF", stats);
      // 1*6.0 + 1*4.5 + 1*3.5 + 8*0.4 + 5*0.3 = 6.0 + 4.5 + 3.5 + 3.2 + 1.5 = 18.7
      expect(score).toBe(18.7);
    });

    it("resta goles concedidos", () => {
      const stats: MatchStats = {
        goalsConceded: 1,
      };
      const score = rawScore("DF", stats);
      // -1*1.0 = -1.0
      expect(score).toBe(-1.0);
    });
  });

  describe("Mediocampista (MD)", () => {
    it("calcula puntaje básico de mediocampista", () => {
      const stats: MatchStats = {
        goals: 1,
        assists: 2,
        cleanSheet: true,
        keyPasses: 5,
        recoveries: 4,
      };
      const score = rawScore("MD", stats);
      // 1*4.5 + 2*3.5 + 1*1.0 + 5*0.4 + 4*0.3 = 4.5 + 7.0 + 1.0 + 2.0 + 1.2 = 15.7
      expect(score).toBe(15.7);
    });
  });

  describe("Delantero (FW)", () => {
    it("calcula puntaje básico de delantero", () => {
      const stats: MatchStats = {
        goals: 2,
        assists: 1,
        shotsOnTarget: 4,
        keyPasses: 3,
      };
      const score = rawScore("FW", stats);
      // 2*3.5 + 1*2.5 + 4*0.5 + 3*0.3 = 7.0 + 2.5 + 2.0 + 0.9 = 12.4
      expect(score).toBe(12.4);
    });
  });

  describe("Tarjetas (todas las posiciones)", () => {
    it("resta tarjeta amarilla", () => {
      const stats: MatchStats = {
        goals: 1,
        yellowCards: 1,
      };
      const score = rawScore("FW", stats);
      // 1*3.5 + 1*(-1.0) = 3.5 - 1.0 = 2.5
      expect(score).toBe(2.5);
    });

    it("resta tarjeta roja", () => {
      const stats: MatchStats = {
        goals: 1,
        redCards: 1,
      };
      const score = rawScore("FW", stats);
      // 1*3.5 + 1*(-3.0) = 3.5 - 3.0 = 0.5
      expect(score).toBe(0.5);
    });
  });

  describe("Estadísticas vacías", () => {
    it("retorna 0 con stats vacías", () => {
      const stats: MatchStats = {};
      expect(rawScore("GK", stats)).toBe(0);
      expect(rawScore("DF", stats)).toBe(0);
      expect(rawScore("MD", stats)).toBe(0);
      expect(rawScore("FW", stats)).toBe(0);
    });
  });
});

describe("matchPerformance", () => {
  it("calcula rendimiento positivo", () => {
    // Para FW: base = 7.0, K = 15
    // rawScore = 10.0
    // (10.0 - 7.0) / 15 = 0.2 → tope 0.15
    const perf = matchPerformance(10.0, "FW");
    expect(perf).toBe(PERFORMANCE_CAP);
  });

  it("calcula rendimiento negativo", () => {
    // Para FW: base = 7.0, K = 15
    // rawScore = 4.0
    // (4.0 - 7.0) / 15 = -0.2 → tope -0.15
    const perf = matchPerformance(4.0, "FW");
    expect(perf).toBe(-PERFORMANCE_CAP);
  });

  it("respeta el tope ±0.15", () => {
    // rawScore muy alto
    const perf = matchPerformance(100, "FW");
    expect(perf).toBe(PERFORMANCE_CAP);

    // rawScore muy bajo
    const perfNeg = matchPerformance(-100, "FW");
    expect(perfNeg).toBe(-PERFORMANCE_CAP);
  });

  it("calcula rendimiento dentro del rango", () => {
    // Para FW: base = 7.0, K = 15
    // rawScore = 8.5
    // (8.5 - 7.0) / 15 = 0.1
    const perf = matchPerformance(8.5, "FW");
    expect(perf).toBeCloseTo(0.1, 4);
  });
});

describe("streakMultiplier", () => {
  it("retorna 1.0 para racha 0", () => {
    expect(streakMultiplier(0)).toBe(1.0);
  });

  it("retorna 1.1 para racha 1-2", () => {
    expect(streakMultiplier(1)).toBe(1.1);
    expect(streakMultiplier(2)).toBe(1.1);
  });

  it("retorna 1.2 para racha 3-4", () => {
    expect(streakMultiplier(3)).toBe(1.2);
    expect(streakMultiplier(4)).toBe(1.2);
  });

  it("retorna 1.3 para racha 5-6", () => {
    expect(streakMultiplier(5)).toBe(1.3);
    expect(streakMultiplier(6)).toBe(1.3);
  });

  it("retorna 1.5 para racha 7-8", () => {
    expect(streakMultiplier(7)).toBe(1.5);
    expect(streakMultiplier(8)).toBe(1.5);
  });

  it("retorna 2.0 para racha 9+", () => {
    expect(streakMultiplier(9)).toBe(2.0);
    expect(streakMultiplier(15)).toBe(2.0);
    expect(streakMultiplier(100)).toBe(2.0);
  });
});

describe("updateStreak", () => {
  it("incrementa racha con rendimiento positivo", () => {
    expect(updateStreak(3, 0.1)).toBe(4);
    expect(updateStreak(0, 0.01)).toBe(1);
  });

  it("resetea racha con rendimiento 0 o negativo", () => {
    expect(updateStreak(5, 0)).toBe(0);
    expect(updateStreak(5, -0.1)).toBe(0);
  });
});

describe("competitionMultiplier", () => {
  it("retorna multiplicador base por competición", () => {
    expect(competitionMultiplier("LIGA")).toBe(1.0);
    expect(competitionMultiplier("COPA")).toBe(1.1);
    expect(competitionMultiplier("EUROPA_LEAGUE")).toBe(1.2);
    expect(competitionMultiplier("LIBERTADORES")).toBe(1.3);
    expect(competitionMultiplier("MUNDIAL_CLUBES")).toBe(1.4);
    expect(competitionMultiplier("CHAMPIONS")).toBe(1.5);
  });

  it("agrega bono de eliminatoria", () => {
    expect(competitionMultiplier("CHAMPIONS", true)).toBe(1.75);
    expect(competitionMultiplier("LIGA", true)).toBe(1.25);
  });
});

describe("tokenPrice", () => {
  it("calcula precio con rendimiento positivo", () => {
    const price = tokenPrice(100, 0.1, 1.0, 1.0);
    // 100 * (1 + 0.1 * 1.0 * 1.0) = 100 * 1.1 = 110
    expect(price).toBeCloseTo(110, 5);
  });

  it("calcula precio con rendimiento negativo", () => {
    const price = tokenPrice(100, -0.1, 1.0, 1.0);
    // 100 * (1 + (-0.1) * 1.0 * 1.0) = 100 * 0.9 = 90
    expect(price).toBeCloseTo(90, 5);
  });

  it("respeta precio mínimo", () => {
    const price = tokenPrice(1, -0.5, 1.0, 1.0);
    expect(price).toBeCloseTo(0.5, 5);
  });

  it("respeta precio máximo", () => {
    const price = tokenPrice(400, 0.5, 1.5, 2.0);
    // 400 * (1 + 0.5 * 1.5 * 2.0) = 400 * 2.5 = 1000 → tope 500
    expect(price).toBeCloseTo(500, 5);
  });
});

describe("runOracle", () => {
  it("ejecuta el oráculo completo correctamente", () => {
    const result = runOracle({
      position: "FW",
      anchor: 100,
      stats: { goals: 2, assists: 1, shotsOnTarget: 4, keyPasses: 3 },
      competition: "LIGA",
      previousStreak: 0,
    });

    expect(result).toHaveProperty("rawScore");
    expect(result).toHaveProperty("performance");
    expect(result).toHaveProperty("price");
    expect(result).toHaveProperty("changePct");
    expect(result).toHaveProperty("matchRating");
    expect(result.rawScore).toBe(12.4);
    expect(result.baseScore).toBe(7.0);
    expect(result.compMultiplier).toBe(1.0);
    expect(result.streakMultiplier).toBe(1.0);
    expect(result.price).toBeGreaterThan(0);
    
    // R'_match = (12.4 - 7.0)/15 = 0.36
    // Rating = 70 + 60*0.36 = 91.6
    expect(result.matchRating).toBeCloseTo(91.6, 1);
  });

  it("valida ejemplo de Courtois (Portero)", () => {
    const result = runOracle({
      position: "GK",
      anchor: 45,
      stats: { saves: 6, penaltySaves: 1, cleanSheet: true, goalsConceded: 0 },
      competition: "CHAMPIONS",
      previousStreak: 3,
    });

    // S_GK = 6*0.8 + 1*5.0 + 1*4.0 = 4.8 + 5.0 + 4.0 = 13.8
    expect(result.rawScore).toBe(13.8);
    // R_match = (13.8 - 5.0) / 15 = 0.587 → tope 0.15
    expect(result.performance).toBe(PERFORMANCE_CAP);
    // M_comp = 1.5 (Champions)
    expect(result.compMultiplier).toBe(1.5);
    // M_streak = 1.2 (3 jornadas)
    expect(result.streakMultiplier).toBe(1.2);
    // P_t = 45 * (1 + 0.15 * 1.5 * 1.2) = 45 * 1.27 = 57.15
    expect(result.price).toBeCloseTo(57.15, 1);
    
    // Rating = 70 + 60*0.587 = 105.2 (capped at 100)
    expect(result.matchRating).toBe(100);
  });

  it("resetea racha con rendimiento negativo", () => {
    const result = runOracle({
      position: "FW",
      anchor: 100,
      stats: { goalsConceded: 0 },
      competition: "LIGA",
      previousStreak: 5,
    });

    // Con 0 goles y 0 asistencias, el rendimiento será negativo
    expect(result.newStreak).toBe(0);
    expect(result.streakMultiplier).toBe(1.0);
    // Rating = 70 + 60*((0-7)/15) = 70 + 60*(-0.467) = 42.0
    expect(result.matchRating).toBeCloseTo(42.0, 1);
  });
});

describe("calculateGlobalRating (Suavizado)", () => {
  it("inicializa con la nueva calificación si no hay rating previo", () => {
    const rating = calculateGlobalRating(0, 85.0);
    expect(rating).toBe(85.0);
  });

  it("aplica el suavizado ponderado con alpha = 0.3", () => {
    // previous = 70.0, newMatch = 88.0
    // rating = 0.3 * 88.0 + 0.7 * 70.0 = 26.4 + 49.0 = 75.4
    const rating = calculateGlobalRating(70.0, 88.0, 0.3);
    expect(rating).toBe(75.4);
  });

  it("degrada suavemente cuando hay un rendimiento bajo", () => {
    // previous = 75.4, newMatch = 45.0
    // rating = 0.3 * 45.0 + 0.7 * 75.4 = 13.5 + 52.78 = 66.28 -> 66.3
    const rating = calculateGlobalRating(75.4, 45.0, 0.3);
    expect(rating).toBe(66.3);
  });
});

describe("getCardValuation", () => {
  it("calcula valoración estándar como el precio base", () => {
    expect(getCardValuation(27.50, "standard")).toBe(27.50);
    expect(getCardValuation(78.20, "standard")).toBe(78.20);
  });

  it("calcula valoración acumulada y primas para nivel Plata", () => {
    // Güler (c1): base = 27.50. Silver = 5 * 27.50 + 10 = 137.50 + 10 = 147.50
    expect(getCardValuation(27.50, "silver")).toBe(147.50);
    // Bellingham (c3): base = 78.20. Silver = 5 * 78.20 + 30 = 391.00 + 30 = 421.00
    expect(getCardValuation(78.20, "silver")).toBeCloseTo(421.00, 5);
  });

  it("calcula valoración acumulada y primas de forma recursiva para nivel Oro", () => {
    // Güler (c1): base = 27.50. Silver = 147.50. Gold = 4 * 147.50 + 50 = 590 + 50 = 640
    expect(getCardValuation(27.50, "gold")).toBe(640.00);
    // Bellingham (c3): base = 78.20. Silver = 421.00. Gold = 4 * 421.00 + 150 = 1684 + 150 = 1834
    expect(getCardValuation(78.20, "gold")).toBeCloseTo(1834.00, 5);
  });
});

describe("getReferralBonusPercent", () => {
  it("retorna comisiones de referidos correctas para mercado secundario (P2P)", () => {
    expect(getReferralBonusPercent("standard", "c1", "secondary")).toBe(0.10);
    expect(getReferralBonusPercent("silver", "c1", "secondary")).toBe(0.15);
    expect(getReferralBonusPercent("silver", "c3", "secondary")).toBe(0.20);
    expect(getReferralBonusPercent("legend", "c1", "secondary")).toBe(0.45);
    expect(getReferralBonusPercent("legend", "c3", "secondary")).toBe(0.50);
  });

  it("retorna comisiones de referidos correctas para mercado primario (IPO)", () => {
    expect(getReferralBonusPercent("standard", "c1", "primary")).toBe(0.030);
    expect(getReferralBonusPercent("silver", "c1", "primary")).toBe(0.035);
    expect(getReferralBonusPercent("silver", "c3", "primary")).toBe(0.040);
    expect(getReferralBonusPercent("legend", "c1", "primary")).toBe(0.070);
    expect(getReferralBonusPercent("legend", "c3", "primary")).toBe(0.080);
  });

  it("retorna comisiones correctas para el nivel de Socio Influencer", () => {
    expect(getReferralBonusPercent("influencer", "c1", "primary")).toBe(0.10);
    expect(getReferralBonusPercent("influencer", "c1", "secondary")).toBe(0.60);
  });
});

