"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { runOracle, calculateGlobalRating } from "@/lib/engine/oracle";
import type { Position, MatchStats, Competition } from "@/lib/engine/types";
import { useAuth } from "@/context/AuthContext";

// Player Type Definition
export interface Player {
  id: string;
  name: string;
  ticker: string;
  team: string;
  position: Position;
  nationality: string;
  price: number;
  priceChangePercent: number;
  stockRemaining: number;
  stockTotal: number;
  pointsLastWeek: number;
  globalRating?: number; // Smooth overall rating (EMA / fundido)
  streak: number;
  priceHistory: number[]; // Last 30 hours/points
  last5Scores: number[];  // L5 scores
  goals: number;
  assists: number;
  shots: number;
  isFrozen: boolean;
  isRookie?: boolean;
  isHighHype?: boolean;
  isRetired?: boolean;
  historicalTeams?: string[];
}

// Helper functions for 5-tier forge economics
export function getPlayerCategory(price: number): "c1" | "c2" | "c3" | "c4" | "c5" {
  if (price < 30) return "c1";
  if (price < 60) return "c2";
  if (price < 100) return "c3";
  if (price < 160) return "c4";
  return "c5";
}

export function getForgeRequirements(
  targetTier: "silver" | "gold" | "diamond" | "legend",
  category: "c1" | "c2" | "c3" | "c4" | "c5"
): { cards: number; fee: number } {
  // Standard→Silver: 10 | Silver→Gold: 8 | Gold→Diamond: 6 | Diamond→Legend: 5
  // (decreasing because each higher-tier card is inherently harder to accumulate)
  const cardsMap: Record<"silver" | "gold" | "diamond" | "legend", Record<"c1" | "c2" | "c3" | "c4" | "c5", number>> = {
    silver:  { c1: 10, c2: 10, c3: 10, c4: 10, c5: 10 },
    gold:    { c1: 8,  c2: 8,  c3: 8,  c4: 8,  c5: 8  },
    diamond: { c1: 6,  c2: 6,  c3: 6,  c4: 6,  c5: 6  },
    legend:  { c1: 5,  c2: 5,  c3: 5,  c4: 5,  c5: 5  },
  };

  const feeMap: Record<"silver" | "gold" | "diamond" | "legend", number> = {
    silver: 10,
    gold: 22,
    diamond: 42,
    legend: 78,
  };

  return {
    cards: cardsMap[targetTier][category],
    fee: feeMap[targetTier],
  };
}

export function getCardValuation(
  basePrice: number,
  tier: "standard" | "silver" | "gold" | "diamond" | "legend"
): number {
  const category = getPlayerCategory(basePrice);
  
  const cardsMap = {
    silver:  { c1: 10, c2: 10, c3: 10, c4: 10, c5: 10 },
    gold:    { c1: 8,  c2: 8,  c3: 8,  c4: 8,  c5: 8  },
    diamond: { c1: 6,  c2: 6,  c3: 6,  c4: 6,  c5: 6  },
    legend:  { c1: 5,  c2: 5,  c3: 5,  c4: 5,  c5: 5  },
  };

  const premiumMap = {
    silver: { c1: 10, c2: 20, c3: 30, c4: 45, c5: 60 },
    gold: { c1: 50, c2: 100, c3: 150, c4: 220, c5: 300 },
    diamond: { c1: 250, c2: 500, c3: 750, c4: 1100, c5: 1500 },
    legend: { c1: 1000, c2: 2000, c3: 3000, c4: 4500, c5: 6000 },
  };

  if (tier === "standard") {
    return basePrice;
  }
  
  if (tier === "silver") {
    const cardsNeeded = cardsMap.silver[category];
    const premium = premiumMap.silver[category];
    return cardsNeeded * basePrice + premium;
  }
  
  if (tier === "gold") {
    const cardsNeeded = cardsMap.gold[category];
    const premium = premiumMap.gold[category];
    const silverVal = getCardValuation(basePrice, "silver");
    return cardsNeeded * silverVal + premium;
  }
  
  if (tier === "diamond") {
    const cardsNeeded = cardsMap.diamond[category];
    const premium = premiumMap.diamond[category];
    const goldVal = getCardValuation(basePrice, "gold");
    return cardsNeeded * goldVal + premium;
  }
  
  if (tier === "legend") {
    const cardsNeeded = cardsMap.legend[category];
    const premium = premiumMap.legend[category];
    const diamondVal = getCardValuation(basePrice, "diamond");
    return cardsNeeded * diamondVal + premium;
  }
  
  return basePrice;
}

export function getReferralBonusPercent(
  tier: "standard" | "silver" | "gold" | "diamond" | "legend" | "influencer",
  category: "c1" | "c2" | "c3" | "c4" | "c5",
  marketType: "primary" | "secondary"
): number {
  if (tier === "influencer") {
    return marketType === "primary" ? 0.10 : 0.60;
  }
  // Unified referral rate per tier (fixed, no ranges, no category split)
  // Standard: 6%, Silver: 14%, Gold: 24%, Diamond: 34%, Legend: 45%, Influencer: 55%
  const flatRate: Record<string, number> = {
    standard:   0.06,
    silver:     0.14,
    gold:       0.24,
    diamond:    0.34,
    legend:     0.45,
    influencer: marketType === "primary" ? 0.10 : 0.55,
  };
  return flatRate[tier] ?? 0.06;
}

export function getTierPriceMultiplier(
  tier: "standard" | "silver" | "gold" | "diamond" | "legend",
  category: "c1" | "c2" | "c3" | "c4" | "c5",
  basePrice?: number
): number {
  if (tier === "standard") return 1.0;
  
  const price = basePrice !== undefined ? basePrice : (
    category === "c1" ? 20 :
    category === "c2" ? 45 :
    category === "c3" ? 80 :
    category === "c4" ? 130 : 180
  );

  return getCardValuation(price, tier) / price;
}

export function getP2PVolumeFeePercent(
  tier: "standard" | "silver" | "gold" | "diamond" | "legend",
  category: "c1" | "c2" | "c3" | "c4" | "c5"
): number {
  if (tier === "standard") return 0.05;
  
  const feeMatrix: Record<"silver" | "gold" | "diamond" | "legend", Record<"c1" | "c2" | "c3" | "c4" | "c5", number>> = {
    silver: { c1: 0.045, c2: 0.045, c3: 0.040, c4: 0.040, c5: 0.040 },
    gold: { c1: 0.038, c2: 0.038, c3: 0.032, c4: 0.032, c5: 0.032 },
    diamond: { c1: 0.031, c2: 0.031, c3: 0.026, c4: 0.026, c5: 0.026 },
    legend: { c1: 0.025, c2: 0.025, c3: 0.020, c4: 0.020, c5: 0.020 },
  };
  
  return feeMatrix[tier][category];
}

export function getBetFeePercent(
  tier: "standard" | "silver" | "gold" | "diamond" | "legend",
  category: "c1" | "c2" | "c3" | "c4" | "c5"
): number {
  if (tier === "standard") return 0.05;
  
  const feeMatrix: Record<"silver" | "gold" | "diamond" | "legend", Record<"c1" | "c2" | "c3" | "c4" | "c5", number>> = {
    silver: { c1: 0.047, c2: 0.047, c3: 0.044, c4: 0.044, c5: 0.044 },
    gold: { c1: 0.041, c2: 0.041, c3: 0.037, c4: 0.037, c5: 0.037 },
    diamond: { c1: 0.036, c2: 0.036, c3: 0.031, c4: 0.031, c5: 0.031 },
    legend: { c1: 0.030, c2: 0.030, c3: 0.025, c4: 0.025, c5: 0.025 },
  };
  
  return feeMatrix[tier][category];
}

// User Specific Card
export interface UserCard {
  id: string;
  playerId: string;
  isGold: boolean;
  tier: "standard" | "silver" | "gold" | "diamond" | "legend";
  acquiredPrice: number;
  acquiredAt: string;
  serialNumber: number; // Unique sequential serial number
  // Retired legend fields
  retiredAssignedTeam?: string;
  retiredFreeAssignmentUsed?: boolean;
}

/** Fee to reassign a retired legend's team, by card tier. */
export const RETIRED_REASSIGN_FEE: Record<"standard" | "silver" | "gold" | "diamond" | "legend", number> = {
  standard: 5,
  silver: 10,
  gold: 20,
  diamond: 35,
  legend: 50,
};

// Wagering/Bet Type
export interface BetChallenge {
  id: string;
  title: string;
  creator: string;
  creatorAvatar?: string;
  playerId: string;
  playerTicker: string;
  stake: number;
  pool: number;
  type: string;
  status: "open" | "accepted" | "won" | "lost" | "resolved";
  resolvedAt?: string;
}

// P2P Secondary Market Listing
export interface P2PListing {
  id: string;
  cardId: string;
  playerId: string;
  sellerName: string;
  price: number;
  isGold: boolean;
  tier: "standard" | "silver" | "gold" | "diamond" | "legend";
  serialNumber: number;
  createdAt: string;
}

// Main State context
interface StoreContextType {
  balance: number;                   // USDC Wallet
  depositedTotal: number;
  withdrawnTotal: number;
  players: Player[];
  userCards: UserCard[];
  bets: BetChallenge[];
  p2pListings: P2PListing[];
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    timestamp: string;
    status: "success" | "pending";
  }>;
  referralCode: string;
  referralsCount: number;
  referralEarnings: number;
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  buyPlayer: (playerId: string) => Promise<{ success: boolean; message: string }>;
  sellPlayer: (cardId: string) => Promise<{ success: boolean; message: string }>;
  listCardForSale: (cardId: string, price: number) => { success: boolean; message: string };
  cancelP2PListing: (listingId: string) => { success: boolean; message: string };
  buyP2PListing: (listingId: string) => { success: boolean; message: string };
  createBet: (data: { playerId: string; title: string; stake: number; type: any }) => Promise<{ success: boolean; message: string }>;
  acceptBet: (betId: string) => Promise<{ success: boolean; message: string }>;
  craftGoldPlayer: (playerId: string) => Promise<{ success: boolean; message: string }>;
  forgeCard: (playerId: string, targetTier: "silver" | "gold" | "diamond" | "legend") => Promise<{ success: boolean; message: string }>;
  assignRetiredTeam: (cardId: string, team: string) => { success: boolean; message: string };
  depositFunds: (amount: number, method: "solana" | "cryptomus" | "card" | "crypto" | "bank") => void;
  withdrawFunds: (amount: number, method: "solana" | "cryptomus" | "crypto" | "bank" | "card") => { success: boolean; message: string };
  simulateMatchDay: () => void;
  userTier: "standard" | "silver" | "gold" | "diamond" | "legend";
  username: string;
  setUsername: (name: string) => void;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isInfluencer: boolean;
  toggleInfluencer: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// Generate dummy prices for the last 30 intervals
const generateHistory = (base: number) => {
  const result: number[] = [];
  let current = base;
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.49) * 2;
    current = Math.max(10, Number((current + change).toFixed(2)));
    result.push(current);
  }
  return result;
};
const INITIAL_PLAYERS: Player[] = [
  {
    id: "mbp-rm",
    name: "Kylian Mbappé",
    ticker: "MBP-RM",
    team: "Real Madrid",
    position: "FW",
    nationality: "Francia 🇫🇷",
    price: 60.00,
    priceChangePercent: 12.5,
    stockRemaining: 8,
    stockTotal: 50,
    pointsLastWeek: 84.0,
    globalRating: 80.5,
    streak: 5,
    priceHistory: generateHistory(94.40),
    last5Scores: [84.0, 78.5, 82.0, 70.0, 88.0],
    goals: 2,
    assists: 1,
    shots: 4,
    isFrozen: false,
    isRookie: false,
    isHighHype: true,
  },
  {
    id: "erh-mc",
    name: "Erling Haaland",
    ticker: "ERH-MC",
    team: "Man City",
    position: "FW",
    nationality: "Noruega 🇳🇴",
    price: 60.00,
    priceChangePercent: 8.3,
    stockRemaining: 15,
    stockTotal: 50,
    pointsLastWeek: 81.2,
    globalRating: 79.0,
    streak: 4,
    priceHistory: generateHistory(72.30),
    last5Scores: [81.2, 90.0, 68.0, 76.0, 80.0],
    goals: 1,
    assists: 0,
    shots: 5,
    isFrozen: false,
    isRookie: false,
    isHighHype: true,
  },
  {
    id: "vnj-rm",
    name: "Vinícius Júnior",
    ticker: "VNJ-RM",
    team: "Real Madrid",
    position: "FW",
    nationality: "Brasil 🇧🇷",
    price: 60.00,
    priceChangePercent: -2.1,
    stockRemaining: 12,
    stockTotal: 50,
    pointsLastWeek: 64.8,
    globalRating: 68.9,
    streak: 1,
    priceHistory: generateHistory(88.50),
    last5Scores: [64.8, 73.6, 60.0, 80.0, 66.0],
    goals: 0,
    assists: 1,
    shots: 3,
    isFrozen: false,
    isRookie: false,
    isHighHype: false,
  },
  {
    id: "bel-rm",
    name: "Jude Bellingham",
    ticker: "BEL-RM",
    team: "Real Madrid",
    position: "MD",
    nationality: "Inglaterra 🇬🇧",
    price: 50.00,
    priceChangePercent: 5.2,
    stockRemaining: 10,
    stockTotal: 50,
    pointsLastWeek: 73.6,
    globalRating: 71.9,
    streak: 2,
    priceHistory: generateHistory(78.20),
    last5Scores: [73.6, 78.0, 68.8, 64.0, 75.2],
    goals: 1,
    assists: 1,
    shots: 2,
    isFrozen: false,
    isRookie: false,
    isHighHype: false,
  },
  {
    id: "yam-bl",
    name: "Lamine Yamal",
    ticker: "YAM-BL",
    team: "FC Barcelona",
    position: "FW",
    nationality: "España 🇪🇸",
    price: 45.00,
    priceChangePercent: 15.2,
    stockRemaining: 3,
    stockTotal: 50,
    pointsLastWeek: 86.8,
    globalRating: 87.0,
    streak: 6,
    priceHistory: generateHistory(48.50),
    last5Scores: [86.8, 82.0, 92.0, 86.0, 88.0],
    goals: 2,
    assists: 2,
    shots: 3,
    isFrozen: false,
    isRookie: true,
    isHighHype: true,
  },
  {
    id: "cot-rm",
    name: "Thibaut Courtois",
    ticker: "COT-RM",
    team: "Real Madrid",
    position: "GK",
    nationality: "Bélgica 🇧🇪",
    price: 25.00,
    priceChangePercent: 7.8,
    stockRemaining: 20,
    stockTotal: 50,
    pointsLastWeek: 84.0,
    globalRating: 78.6,
    streak: 3,
    priceHistory: generateHistory(45.20),
    last5Scores: [84.0, 68.0, 72.0, 86.8, 82.0],
    goals: 0,
    assists: 0,
    shots: 0,
    isFrozen: false,
    isRookie: false,
    isHighHype: false,
  },
  {
    id: "sal-aj",
    name: "Mohamed Salah",
    ticker: "SAL-AJ",
    team: "Liverpool",
    position: "FW",
    nationality: "Egipto 🇪🇬",
    price: 35.00,
    priceChangePercent: 3.1,
    stockRemaining: 18,
    stockTotal: 50,
    pointsLastWeek: 76.0,
    globalRating: 74.2,
    streak: 0,
    priceHistory: generateHistory(65.80),
    last5Scores: [76.0, 80.8, 66.0, 72.0, 76.0],
    goals: 1,
    assists: 1,
    shots: 3,
    isFrozen: false,
    isRookie: false,
    isHighHype: false,
  },
  {
    id: "van-li",
    name: "Virgil van Dijk",
    ticker: "VAN-LI",
    team: "Liverpool",
    position: "DF",
    nationality: "Países Bajos 🇳🇱",
    price: 25.00,
    priceChangePercent: 4.5,
    stockRemaining: 22,
    stockTotal: 50,
    pointsLastWeek: 74.0,
    globalRating: 73.0,
    streak: 2,
    priceHistory: generateHistory(52.40),
    last5Scores: [74.0, 68.8, 76.0, 72.0, 74.0],
    goals: 0,
    assists: 0,
    shots: 1,
    isFrozen: false,
    isRookie: false,
    isHighHype: false,
  },
  {
    id: "mai-mu",
    name: "Kobbie Mainoo",
    ticker: "MAI-MU",
    team: "Manchester United",
    position: "MD",
    nationality: "Inglaterra 🇬🇧",
    price: 25.00,
    priceChangePercent: 4.8,
    stockRemaining: 15,
    stockTotal: 50,
    pointsLastWeek: 68.0,
    globalRating: 70.2,
    streak: 2,
    priceHistory: generateHistory(28.00),
    last5Scores: [68.0, 72.0, 64.0, 78.0, 70.0],
    goals: 0,
    assists: 1,
    shots: 1,
    isFrozen: false,
    isRookie: true,
    isHighHype: false,
  },
  {
    id: "end-rm",
    name: "Endrick",
    ticker: "END-RM",
    team: "Real Madrid",
    position: "FW",
    nationality: "Brasil 🇧🇷",
    price: 25.00,
    priceChangePercent: 9.1,
    stockRemaining: 5,
    stockTotal: 50,
    pointsLastWeek: 72.0,
    globalRating: 75.0,
    streak: 3,
    priceHistory: generateHistory(29.50),
    last5Scores: [72.0, 80.0, 60.0, 75.0, 88.0],
    goals: 1,
    assists: 0,
    shots: 3,
    isFrozen: false,
    isRookie: true,
    isHighHype: true,
  },
  {
    id: "gul-rm",
    name: "Arda Güler",
    ticker: "GUL-RM",
    team: "Real Madrid",
    position: "MD",
    nationality: "Turquía 🇹🇷",
    price: 25.00,
    priceChangePercent: 5.6,
    stockRemaining: 20,
    stockTotal: 50,
    pointsLastWeek: 70.0,
    globalRating: 72.4,
    streak: 2,
    priceHistory: generateHistory(27.50),
    last5Scores: [70.0, 78.0, 68.0, 64.0, 82.0],
    goals: 1,
    assists: 0,
    shots: 2,
    isFrozen: false,
    isRookie: true,
    isHighHype: false,
  },
  // --- LEYENDAS RETIRADAS ---
  {
    id: "ram-ret",
    name: "Sergio Ramos",
    ticker: "RAM-RET",
    team: "Retirado",
    position: "DF",
    nationality: "España 🇪🇸",
    price: 15.00,
    priceChangePercent: 0,
    stockRemaining: 0,
    stockTotal: 25,
    pointsLastWeek: 0,
    globalRating: 82.0,
    streak: 0,
    priceHistory: generateHistory(15.00),
    last5Scores: [],
    goals: 0,
    assists: 0,
    shots: 0,
    isFrozen: true,
    isRookie: false,
    isHighHype: false,
    isRetired: true,
    historicalTeams: ["Real Madrid", "PSG", "Sevilla"],
  },
];

const INITIAL_USER_CARDS: UserCard[] = [
  // 30x Yamal cards (standard) to test standard -> silver
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `card-yam-s${i}`,
    playerId: "yam-bl",
    isGold: false,
    tier: "standard" as const,
    acquiredPrice: 48.50,
    acquiredAt: new Date().toISOString(),
    serialNumber: i + 1,
  })),
  // 25x Bellingham cards (silver) to test silver -> gold
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `card-bel-si${i}`,
    playerId: "bel-rm",
    isGold: false,
    tier: "silver" as const,
    acquiredPrice: 78.20,
    acquiredAt: new Date().toISOString(),
    serialNumber: i + 1,
  })),
  // 20x Courtois cards (gold) to test gold -> diamond
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `card-cot-g${i}`,
    playerId: "cot-rm",
    isGold: true,
    tier: "gold" as const,
    acquiredPrice: 45.20,
    acquiredAt: new Date().toISOString(),
    serialNumber: i + 1,
  })),
  // 18x Haaland cards (diamond) to test diamond -> legend
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `card-erh-d${i}`,
    playerId: "erh-mc",
    isGold: false,
    tier: "diamond" as const,
    acquiredPrice: 72.30,
    acquiredAt: new Date().toISOString(),
    serialNumber: i + 1,
  })),
  // 3x Mbappé standard cards
  { id: "card-mbp1", playerId: "mbp-rm", isGold: false, tier: "standard", acquiredPrice: 94.40, acquiredAt: "2026-06-01T10:00:00Z", serialNumber: 1 },
  { id: "card-mbp2", playerId: "mbp-rm", isGold: false, tier: "standard", acquiredPrice: 91.20, acquiredAt: "2026-06-02T12:00:00Z", serialNumber: 2 },
  { id: "card-mbp3", playerId: "mbp-rm", isGold: false, tier: "standard", acquiredPrice: 95.00, acquiredAt: "2026-06-03T15:00:00Z", serialNumber: 3 },
  // 1x Sergio Ramos demo retired legend card (no team assigned yet)
  { id: "card-ram-ret1", playerId: "ram-ret", isGold: false, tier: "standard", acquiredPrice: 15.00, acquiredAt: "2026-06-10T09:00:00Z", serialNumber: 1 },
];

const INITIAL_BETS: BetChallenge[] = [
  {
    id: "bet-haaland",
    title: "¿Haaland mete gol en el próximo partido?",
    creator: "Carlos_M",
    playerId: "erh-mc",
    playerTicker: "ERH-MC",
    stake: 10,
    pool: 20,
    type: "goals",
    status: "open",
  },
  {
    id: "bet-mbappe-points",
    title: "¿Mbappé registrará más de 8.5 puntos de rendimiento?",
    creator: "Ana_Football",
    playerId: "mbp-rm",
    playerTicker: "MBP-RM",
    stake: 25,
    pool: 50,
    type: "points",
    status: "open",
  }
];

const INITIAL_P2P_LISTINGS: P2PListing[] = [
  {
    id: "listing-1",
    cardId: "card-external-1",
    playerId: "mbp-rm",
    sellerName: "TradingLegend",
    price: 98.50,
    isGold: false,
    tier: "standard",
    serialNumber: 15,
    createdAt: "2026-06-10T14:00:00Z"
  },
  {
    id: "listing-2",
    cardId: "card-external-2",
    playerId: "yam-bl",
    sellerName: "BarcaFan_99",
    price: 52.00,
    isGold: false,
    tier: "standard",
    serialNumber: 9,
    createdAt: "2026-06-11T09:30:00Z"
  },
  {
    id: "listing-3",
    cardId: "card-external-3",
    playerId: "sal-aj",
    sellerName: "LiverpoolTrader",
    price: 71.00,
    isGold: false,
    tier: "standard",
    serialNumber: 27,
    createdAt: "2026-06-11T10:15:00Z"
  },
  {
    id: "listing-4",
    cardId: "card-external-4",
    playerId: "erh-mc", // corrected ticker ID erh-mc
    sellerName: "GoalMachineX",
    price: 1716.00,
    isGold: true,
    tier: "gold",
    serialNumber: 3,
    createdAt: "2026-06-11T11:00:00Z"
  },
  {
    id: "listing-5",
    cardId: "card-external-5",
    playerId: "cot-rm",
    sellerName: "GKCollector",
    price: 49.90,
    isGold: false,
    tier: "standard",
    serialNumber: 41,
    createdAt: "2026-06-11T11:45:00Z"
  },
  {
    id: "listing-6",
    cardId: "card-external-6",
    playerId: "mbp-rm",
    sellerName: "CryptoSoccerFan",
    price: 2158.00,
    isGold: true,
    tier: "gold",
    serialNumber: 7,
    createdAt: "2026-06-11T12:30:00Z"
  },
  {
    id: "listing-7",
    cardId: "card-external-7",
    playerId: "yam-bl",
    sellerName: "FantasyKing",
    price: 47.50,
    isGold: false,
    tier: "standard",
    serialNumber: 88,
    createdAt: "2026-06-11T13:00:00Z"
  },
  {
    id: "listing-8",
    cardId: "card-external-8",
    playerId: "sal-aj",
    sellerName: "RedStarDealer",
    price: 68.75,
    isGold: false,
    tier: "standard",
    serialNumber: 12,
    createdAt: "2026-06-11T14:00:00Z"
  },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated, profile, getToken, refreshProfile } = useAuth();

  // Llama a un endpoint autenticado con el token real de Web3Auth.
  const authFetch = useCallback(async (path: string, body?: unknown) => {
    const token = await getToken();
    if (!token) return { ok: false, data: { error: "Debes iniciar sesión para hacer esto" } };
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }, [getToken]);

  // State Initialization
  const [balance, setBalance] = useState<number>(1247.50);
  const [depositedTotal, setDepositedTotal] = useState<number>(50.0);
  const [withdrawnTotal, setWithdrawnTotal] = useState<number>(0.0);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [userCards, setUserCards] = useState<UserCard[]>(INITIAL_USER_CARDS);
  const [bets, setBets] = useState<BetChallenge[]>(INITIAL_BETS);
  const [p2pListings, setP2pListings] = useState<P2PListing[]>(INITIAL_P2P_LISTINGS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([
    { id: "tx-1", type: "Depósito (Tarjeta)", amount: 50.00, description: "Fondos iniciales depositados con tarjeta", timestamp: "2026-06-01T12:00:00Z", status: "success" },
    { id: "tx-2", type: "Compra Ficha", amount: -94.40, description: "Compra de ficha Mbappe MBP-RM en IPO", timestamp: "2026-06-01T12:10:00Z", status: "success" }
  ]);

  const referralCode = "VALOR-X7K2M";
  const referralsCount = 12;
  const referralEarnings = 24.50;

  // Editable Profile Settings
  const [username, setUsername] = useState<string>("Usuario123");
  const [userAvatar, setUserAvatar] = useState<string>("👤");
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isInfluencer, setIsInfluencer] = useState<boolean>(false);
  const toggleInfluencer = () => setIsInfluencer(prev => !prev);

  // Dynamic user tier based on highest owned card
  const [userTier, setUserTier] = useState<"standard" | "silver" | "gold" | "diamond" | "legend">("standard");

  useEffect(() => {
    const tierOrder = { standard: 0, silver: 1, gold: 2, diamond: 3, legend: 4 };
    let highest: "standard" | "silver" | "gold" | "diamond" | "legend" = "standard";
    userCards.forEach(card => {
      const t = card.tier || (card.isGold ? "gold" : "standard");
      if (tierOrder[t] > tierOrder[highest]) {
        highest = t;
      }
    });
    setUserTier(highest);
  }, [userCards]);

  // Balance real: mientras haya sesión, el saldo mostrado es el del perfil en Supabase
  // (fuente de verdad server-side), no el estado local simulado.
  useEffect(() => {
    if (authenticated && profile) {
      setBalance(profile.balance_usdc);
    }
  }, [authenticated, profile]);

  // Fichas reales del usuario (reemplaza el inventario de demo una vez hay sesión).
  const loadRealCards = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/cards", { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const rows: any[] = await res.json();
      setUserCards(rows.map((r) => ({
        id: r.id,
        playerId: r.player_id,
        isGold: r.tier === "gold",
        tier: r.tier,
        acquiredPrice: r.acquired_price,
        acquiredAt: r.acquired_at,
        serialNumber: r.serial_number,
        retiredAssignedTeam: r.retired_team ?? undefined,
        retiredFreeAssignmentUsed: r.retired_free_used ?? undefined,
      })));
    } catch (err) {
      console.error("loadRealCards error:", err);
    }
  }, [getToken]);

  // Duelos reales abiertos (endpoint público, no requiere sesión para listar).
  const loadRealDuels = useCallback(async () => {
    try {
      const res = await fetch("/api/duels?status=open");
      if (!res.ok) return;
      const { duels: rows }: { duels: any[] } = await res.json();
      setBets(rows.map((r) => ({
        id: r.id,
        title: r.title,
        creator: r.creator_id?.slice(0, 8) ?? "Usuario",
        playerId: r.player_id,
        playerTicker: players.find((p) => p.id === r.player_id)?.ticker ?? r.player_id,
        stake: r.stake_usdc,
        pool: r.pool_usdc,
        type: r.bet_type,
        status: r.status,
        resolvedAt: r.resolved_at ?? undefined,
      })));
    } catch (err) {
      console.error("loadRealDuels error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadRealCards();
    } else {
      setUserCards([]);
    }
  }, [authenticated, loadRealCards]);

  useEffect(() => {
    loadRealDuels();
  }, [loadRealDuels]);

  // Real-time fluctuating price generator simulation.
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayers(prevPlayers => 
        prevPlayers.map(p => {
          // If frozen (e.g. game in progress), don't fluctuate
          if (p.isFrozen) return p;

          // Minor fluctuation: -0.8% to +0.9% every few seconds
          const changePercent = (Math.random() - 0.47) * 1.5; 
          const currentPrice = Number(p.price.toFixed(2));
          const delta = Number((currentPrice * (changePercent / 100)).toFixed(2));
          const newPrice = Math.max(10, Number((currentPrice + delta).toFixed(2)));
          const totalHistory = [...p.priceHistory, newPrice].slice(-30);
          const oldBase = p.priceHistory[0] || newPrice;
          const overallDiffPercent = Number((((newPrice - oldBase) / oldBase) * 100).toFixed(1));

          return {
            ...p,
            price: newPrice,
            priceChangePercent: overallDiffPercent,
            priceHistory: totalHistory
          };
        })
      );
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  // Action: Buy Player in IPO — el servidor recalcula precio/stock/balance, nunca se confía en el cliente.
  const buyPlayer = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "Jugador no encontrado" };

    const { ok, data } = await authFetch("/api/cards/buy", { player_id: playerId });
    if (!ok) return { success: false, message: data.error ?? "Error al procesar la compra" };

    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, stockRemaining: p.stockRemaining - 1 } : p));
    setUserCards(prev => [...prev, {
      id: data.cardId,
      playerId,
      isGold: false,
      tier: "standard",
      acquiredPrice: data.pricePaid,
      acquiredAt: new Date().toISOString(),
      serialNumber: data.serialNumber,
    }]);
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Compra IPO",
        amount: -data.pricePaid,
        description: `Adquisición de ficha ${player.ticker}`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);
    await refreshProfile();

    return { success: true, message: `Has comprado 1 ficha de ${player.name} por ${data.pricePaid.toFixed(2)} USDC` };
  };

  // Action: Sell Player (Instant Quick Sell to platform) — venta/comisión recalculadas en el servidor.
  const sellPlayer = async (cardId: string) => {
    const card = userCards.find(c => c.id === cardId);
    if (!card) return { success: false, message: "Ficha no encontrada en tu inventario" };
    const player = players.find(p => p.id === card.playerId);
    const cardTier = card.tier || (card.isGold ? "gold" : "standard");

    const { ok, data } = await authFetch("/api/cards/sell", { card_id: cardId });
    if (!ok) return { success: false, message: data.error ?? "Error al procesar la venta" };

    setUserCards(prev => prev.filter(c => c.id !== cardId));
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Venta Ficha",
        amount: data.finalAmount,
        description: `Venta de ficha ${player?.ticker ?? card.playerId} (${cardTier.toUpperCase()}) (Comisión: ${data.fee.toFixed(2)} USDC)`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);
    await refreshProfile();

    return { success: true, message: `Ficha vendida por ${data.finalAmount.toFixed(2)} USDC` };
  };
 
  // Action: List card for P2P sale
  const listCardForSale = (cardId: string, price: number) => {
    const cardIndex = userCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, message: "Ficha no encontrada en tu cartera" };
    if (price <= 0) return { success: false, message: "El precio debe ser mayor a 0 USDC" };

    const card = userCards[cardIndex];
    const player = players.find(p => p.id === card.playerId);
    if (!player) return { success: false, message: "Jugador no encontrado" };

    if (player.isFrozen) {
      return { success: false, message: "Este mercado está cerrado temporalmente (Match Lock)" };
    }

    const cardTier = card.tier || (card.isGold ? "gold" : "standard");

    // Move card from user portfolio to P2P listings
    setUserCards(prev => prev.filter(c => c.id !== cardId));
    const newListing: P2PListing = {
      id: `listing-${Date.now()}`,
      cardId: card.id,
      playerId: card.playerId,
      sellerName: "MiUsuarioP2P", // Local user
      price,
      isGold: cardTier === "gold",
      tier: cardTier,
      serialNumber: card.serialNumber,
      createdAt: new Date().toISOString()
    };
    setP2pListings(prev => [newListing, ...prev]);

    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Listado P2P",
        amount: 0,
        description: `Pusiste en venta P2P la ficha ${player.ticker} (${cardTier.toUpperCase()}) por ${price.toFixed(2)} USDC`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);

    return { success: true, message: `Ficha listada a la venta por ${price.toFixed(2)} USDC` };
  };

  // Action: Cancel P2P sale and return card to portfolio
  const cancelP2PListing = (listingId: string) => {
    const listingIndex = p2pListings.findIndex(l => l.id === listingId);
    if (listingIndex === -1) return { success: false, message: "Listado no encontrado" };
    
    const listing = p2pListings[listingIndex];
    const player = players.find(p => p.id === listing.playerId);

    if (player?.isFrozen) {
      return { success: false, message: "Este mercado está cerrado por partido en vivo" };
    }

    // Remove from P2P listings
    setP2pListings(prev => prev.filter(l => l.id !== listingId));
    
    // Add back to portfolio
    const returnedCard: UserCard = {
      id: listing.cardId,
      playerId: listing.playerId,
      isGold: listing.isGold || listing.tier === "gold",
      tier: listing.tier || "standard",
      acquiredPrice: listing.price, // update acquired price to listed price
      acquiredAt: new Date().toISOString(),
      serialNumber: listing.serialNumber
    };
    setUserCards(prev => [...prev, returnedCard]);

    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Cancelación P2P",
        amount: 0,
        description: `Cancelaste la venta P2P de la ficha ${player?.ticker || ""}`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);

    return { success: true, message: "Venta cancelada. La ficha ha vuelto a tu cartera." };
  };

  // Action: Buy P2P Listing from another user
  const buyP2PListing = (listingId: string) => {
    const listingIndex = p2pListings.findIndex(l => l.id === listingId);
    if (listingIndex === -1) return { success: false, message: "La oferta ya no está disponible" };

    const listing = p2pListings[listingIndex];
    const player = players.find(p => p.id === listing.playerId);
    if (!player) return { success: false, message: "Jugador no encontrado" };

    if (player.isFrozen) {
      return { success: false, message: "El mercado está cerrado por partido en vivo (Match Lock)" };
    }

    if (balance < listing.price) {
      return { success: false, message: "Saldo USDC insuficiente para comprar esta ficha" };
    }

    // Deduct balance
    const cost = listing.price;
    setBalance(prev => Number((prev - cost).toFixed(2)));

    // Remove listing
    setP2pListings(prev => prev.filter(l => l.id !== listingId));

    // Add card to user portfolio
    const newCard: UserCard = {
      id: listing.cardId,
      playerId: listing.playerId,
      isGold: listing.isGold || listing.tier === "gold",
      tier: listing.tier || "standard",
      acquiredPrice: cost,
      acquiredAt: new Date().toISOString(),
      serialNumber: listing.serialNumber
    };
    setUserCards(prev => [...prev, newCard]);

    // Save transaction
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Compra P2P",
        amount: -cost,
        description: `Compraste la ficha ${player.ticker} S/N #${listing.serialNumber} en el mercado P2P a @${listing.sellerName}`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);

    return { success: true, message: `Has comprado la ficha de ${player.name} por ${cost.toFixed(2)} USDC` };
  };

  // Action: Create duel/bet — atómico en el servidor (descuenta stake, crea el duelo).
  const createBet = async (data: { playerId: string; title: string; stake: number; type: any }) => {
    const player = players.find(p => p.id === data.playerId);
    if (!player) return { success: false, message: "Jugador no encontrado" };

    const { ok, data: res } = await authFetch("/api/duels", {
      player_id: data.playerId,
      title: data.title,
      bet_type: data.type,
      stake: data.stake,
    });
    if (!ok) return { success: false, message: res.error ?? "Error al crear el duelo" };

    setBets(prev => [{
      id: res.betId,
      title: data.title,
      creator: "Tú",
      creatorAvatar: "👤",
      playerId: data.playerId,
      playerTicker: player.ticker,
      stake: data.stake,
      pool: data.stake,
      type: data.type,
      status: "open",
    }, ...prev]);
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Duelo Creado",
        amount: -data.stake,
        description: `Creación de duelo: "${data.title}"`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);
    await refreshProfile();

    return { success: true, message: `Duelo "${data.title}" creado con éxito` };
  };

  // Action: Accept Duel — atómico en el servidor (descuenta stake, marca 'accepted').
  // NOTA: la resolución (quién gana, rake, pago) NO está implementada todavía --
  // requiere conectar el resultado real del oráculo (ver docs/state/backend.md).
  // Antes se simulaba con Math.random() tras 10s; se quitó porque ahora mueve
  // dinero real y no se puede fingir un resultado.
  const acceptBet = async (betId: string) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return { success: false, message: "Duelo no encontrado" };

    const { ok, data } = await authFetch(`/api/duels/${betId}/accept`);
    if (!ok) return { success: false, message: data.error ?? "Error al aceptar el duelo" };

    setBets(prev => prev.map(b => b.id === betId ? { ...b, status: "accepted" as const, pool: data.poolUsdc } : b));
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        type: "Duelo Aceptado",
        amount: -bet.stake,
        description: `Aceptaste el duelo: "${bet.title}"`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);
    await refreshProfile();

    return { success: true, message: "Duelo aceptado. La resolución llegará cuando el partido termine." };
  };

  // Action: Forge Card (Multi-tier upgrade system) — atómico en el servidor
  // (verifica fichas origen reales, las quema, cobra el fee y crea la nueva ficha).
  const forgeCard = async (
    playerId: string,
    targetTier: "silver" | "gold" | "diamond" | "legend"
  ) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "Jugador no existe" };

    const sourceTier: "standard" | "silver" | "gold" | "diamond" =
      targetTier === "silver" ? "standard" :
      targetTier === "gold" ? "silver" :
      targetTier === "diamond" ? "gold" : "diamond";
    const targetName = targetTier === "silver" ? "Plata" : targetTier === "gold" ? "Oro" : targetTier === "diamond" ? "Diamante" : "Leyenda";

    const { ok, data } = await authFetch("/api/cards/forge", { player_id: playerId, target_tier: targetTier });
    if (!ok) return { success: false, message: data.error ?? "Error al procesar la forja" };

    // Quita las fichas origen quemadas (las más antiguas primero, igual que decide el servidor)
    setUserCards(prev => {
      const sourceCards = prev
        .filter(c => c.playerId === playerId && (c.tier || (c.isGold ? "gold" : "standard")) === sourceTier)
        .sort((a, b) => a.serialNumber - b.serialNumber);
      const burnedIds = new Set(sourceCards.slice(0, data.cardsBurned).map(c => c.id));
      return [
        ...prev.filter(c => !burnedIds.has(c.id)),
        {
          id: data.newCardId,
          playerId,
          isGold: targetTier === "gold",
          tier: targetTier,
          acquiredPrice: player.price,
          acquiredAt: new Date().toISOString(),
          serialNumber: data.serialNumber,
        },
      ];
    });
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, streak: p.streak + 1 } : p));
    setTransactions(prev => [
      {
        id: `tx-forge-${Date.now()}`,
        type: `Forja a ${targetName} ✨`,
        amount: -data.feePaid,
        description: `Forja de ${player.ticker} ${targetName.toUpperCase()} quemando ${data.cardsBurned} fichas ${sourceTier.toUpperCase()} + ${data.feePaid} USDC de fee`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);
    await refreshProfile();

    return {
      success: true,
      message: `¡FORJA EXITOSA! Has creado 1 ficha ${player.ticker} ${targetName.toUpperCase()} S/N #${data.serialNumber} en tu portafolio.`
    };
  };

  // Keep craftGoldPlayer for backward compatibility mapping to gold tier forge
  const craftGoldPlayer = (playerId: string) => {
    return forgeCard(playerId, "gold");
  };

  // Action: Deposit On-ramp
  const depositFunds = (amount: number, method: "solana" | "cryptomus" | "card" | "crypto" | "bank") => {
    let feePercent = 0.005; // 0.5% crypto
    let methodLabel: string = method;

    if (method === "solana") {
      feePercent = 0.0;
      methodLabel = "Solana Wallet (USDC Directo)";
    } else if (method === "cryptomus") {
      feePercent = 0.015; // 1.5% Cryptomus
      methodLabel = "Cryptomus Gateway (Tarjetas & Multi-Cripto)";
    } else if (method === "card") {
      feePercent = 0.025;
      methodLabel = "Tarjeta de Crédito";
    } else if (method === "bank") {
      feePercent = 0.010;
      methodLabel = "Transferencia Bancaria";
    } else if (method === "crypto") {
      feePercent = 0.005;
      methodLabel = "Cripto Genérico";
    }

    const fee = Number((amount * feePercent).toFixed(2));
    const netAmount = Number((amount - fee).toFixed(2));

    setBalance(prev => Number((prev + netAmount).toFixed(2)));
    setDepositedTotal(prev => prev + amount);

    setTransactions(prev => [
      {
        id: `tx-dep-${Date.now()}`,
        type: `Depósito (${methodLabel})`,
        amount: netAmount,
        description: `Depósito de fondos USDC vía ${methodLabel} (Comisión: ${fee.toFixed(2)} USDC)`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);
  };

  // Action: Withdraw Off-ramp
  const withdrawFunds = (amount: number, method: "solana" | "cryptomus" | "crypto" | "bank" | "card") => {
    if (balance < amount) {
      return { success: false, message: "Fondos insuficientes para retirar esa cantidad" };
    }

    let fee = 0;
    let methodLabel: string = method;

    if (method === "solana") {
      fee = 0.50; // flat 0.5 USDC Solana fee
      methodLabel = "Solana Wallet (USDC Directo)";
      if (amount <= fee) {
        return { success: false, message: "El monto a retirar debe ser mayor a la comisión de red de 0.50 USDC" };
      }
    } else if (method === "cryptomus") {
      fee = Number((amount * 0.020).toFixed(2)); // 2.0% fee
      methodLabel = "Cryptomus Gateway";
    } else if (method === "bank") {
      fee = Number((amount * 0.015).toFixed(2));
      methodLabel = "Cuenta Banco";
    } else if (method === "card") {
      fee = Number((amount * 0.020).toFixed(2));
      methodLabel = "Tarjeta";
    } else if (method === "crypto") {
      fee = 0;
      methodLabel = "Cripto Genérico";
    }

    const netAmount = Number((amount - fee).toFixed(2));

    setBalance(prev => Number((prev - amount).toFixed(2)));
    setWithdrawnTotal(prev => prev + amount);

    setTransactions(prev => [
      {
        id: `tx-wth-${Date.now()}`,
        type: `Retiro (${methodLabel})`,
        amount: -amount,
        description: `Solicitud de retiro de fondos USDC procesado (Hacia: ${methodLabel}, Comisión: ${fee.toFixed(2)} USDC)`,
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...prev
    ]);

    return { success: true, message: `Retiro exitoso de ${netAmount.toFixed(2)} USDC (FEE: ${fee} USDC)` };
  };

  // Action: Assign (or reassign) a retired legend card to a historical team
  const assignRetiredTeam = (cardId: string, team: string): { success: boolean; message: string } => {
    const card = userCards.find(c => c.id === cardId);
    if (!card) return { success: false, message: "Ficha no encontrada" };

    const player = players.find(p => p.id === card.playerId);
    if (!player?.isRetired) return { success: false, message: "Esta ficha no es de un jugador retirado" };

    if (!player.historicalTeams?.includes(team)) {
      return { success: false, message: `${team} no es un equipo histórico de ${player.name}` };
    }

    if (card.retiredFreeAssignmentUsed) {
      const fee = RETIRED_REASSIGN_FEE[card.tier];
      if (balance < fee) {
        return { success: false, message: `Necesitas ${fee} USDC para reasignar el equipo` };
      }
      setBalance(prev => prev - fee);
      setTransactions(prev => [
        {
          id: `tx-reassign-${Date.now()}`,
          type: "Reasignación Leyenda Retirada",
          amount: -fee,
          description: `Reasignado "${player.name}" al equipo ${team} (Tasa de transferencia: ${fee} USDC)`,
          timestamp: new Date().toISOString(),
          status: "success" as const,
        },
        ...prev,
      ]);
    }

    setUserCards(prev =>
      prev.map(c =>
        c.id === cardId
          ? { ...c, retiredAssignedTeam: team, retiredFreeAssignmentUsed: true }
          : c
      )
    );

    const msg = card.retiredFreeAssignmentUsed
      ? `Equipo reasignado a ${team}. Tasa cobrada.`
      : `${player.name} asignado a ${team} (asignación gratuita usada).`;
    return { success: true, message: msg };
  };

  // Action: Simulate Matchday performance results using our real Math Oracle engine!
  const simulateMatchDay = () => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p => {
        // Retired legends: price follows the positional average of their assigned team's active players
        if (p.isRetired) {
          const assignedTeam = userCards.find(c => c.playerId === p.id && c.retiredAssignedTeam)?.retiredAssignedTeam;
          if (!assignedTeam) return { ...p, priceChangePercent: 0 };
          const peers = prevPlayers.filter(ap => !ap.isRetired && ap.team === assignedTeam && ap.position === p.position);
          if (peers.length === 0) return { ...p, priceChangePercent: 0 };
          const avgChangePct = peers.reduce((sum, ap) => sum + ap.priceChangePercent, 0) / peers.length;
          const cappedChange = Math.min(10, Math.max(-10, avgChangePct));
          const newPrice = Number(Math.max(0.5, p.price * (1 + cappedChange / 100)).toFixed(2));
          return {
            ...p,
            price: newPrice,
            priceChangePercent: Number(cappedChange.toFixed(1)),
            priceHistory: [...p.priceHistory, newPrice].slice(-30),
          };
        }

        // Generate random realistic stats based on position
        let stats: MatchStats = {};
        let goals = 0;
        let assists = 0;
        let shotsOnTarget = 0;

        if (p.position === "GK") {
          const cleanSheet = Math.random() > 0.45;
          stats = {
            saves: Math.floor(Math.random() * 6),
            penaltySaves: Math.random() > 0.9 ? 1 : 0,
            cleanSheet,
            goalsConceded: cleanSheet ? 0 : Math.floor(Math.random() * 3) + 1,
          };
        } else if (p.position === "DF") {
          const cleanSheet = Math.random() > 0.5;
          goals = Math.random() > 0.92 ? 1 : 0;
          assists = Math.random() > 0.88 ? 1 : 0;
          stats = {
            goals,
            assists,
            cleanSheet,
            recoveries: Math.floor(Math.random() * 9) + 2,
            clearances: Math.floor(Math.random() * 7) + 2,
            goalsConceded: cleanSheet ? 0 : Math.floor(Math.random() * 3) + 1,
          };
        } else if (p.position === "MD") {
          const cleanSheet = Math.random() > 0.6;
          goals = Math.random() > 0.75 ? 1 : 0;
          assists = Math.floor(Math.random() * 2);
          stats = {
            goals,
            assists,
            cleanSheet,
            keyPasses: Math.floor(Math.random() * 5) + 1,
            recoveries: Math.floor(Math.random() * 5) + 1,
          };
        } else if (p.position === "FW") {
          goals = Math.floor(Math.random() * 3); // 0 to 2 goals
          assists = Math.random() > 0.7 ? 1 : 0;
          shotsOnTarget = Math.floor(Math.random() * 4) + 1;
          stats = {
            goals,
            assists,
            shotsOnTarget,
            keyPasses: Math.floor(Math.random() * 3),
          };
        }

        // Call the verified mathematical oracle engine!
        const result = runOracle({
          position: p.position,
          anchor: p.price,
          stats,
          competition: "LIGA",
          isKnockout: false,
          previousStreak: p.streak
        });

        // Enforce the hard cap of +6% / -5% on the price change percentage
        let finalChangePct = result.changePct;
        if (finalChangePct > 6.0) finalChangePct = 6.0;
        else if (finalChangePct < -5.0) finalChangePct = -5.0;

        const newPrice = Number((p.price * (1 + finalChangePct / 100)).toFixed(2));
        const totalHistory = [...p.priceHistory, newPrice].slice(-30);
        const scoreVal = Number(result.matchRating.toFixed(1));
        const updatedLast5 = [...(p.last5Scores || []), scoreVal].slice(-5);
        const previousGlobal = p.globalRating ?? p.pointsLastWeek;
        const newGlobalRating = calculateGlobalRating(previousGlobal, scoreVal, 0.3);

        return {
          ...p,
          price: newPrice,
          priceChangePercent: Number(finalChangePct.toFixed(1)),
          priceHistory: totalHistory,
          last5Scores: updatedLast5,
          pointsLastWeek: scoreVal,
          globalRating: newGlobalRating,
          streak: result.newStreak,
          goals: goals + (p.goals || 0),
          assists: assists + (p.assists || 0),
          shots: shotsOnTarget + (p.shots || 0),
        };
      })
    );

    // Save automatic transaction log
    setTransactions(txs => [
      {
        id: `tx-eval-${Date.now()}`,
        type: "Simulación Jornada ⚽",
        amount: 0,
        description: "Simulación finalizada. Todos los precios se han recalculado dinámicamente con el Oráculo Matemático limitado a +6% / -5% de variación máxima.",
        timestamp: new Date().toISOString(),
        status: "success"
      },
      ...txs
    ]);
  };

  return (
    <StoreContext.Provider value={{
      balance,
      depositedTotal,
      withdrawnTotal,
      players,
      userCards,
      bets,
      p2pListings,
      transactions,
      referralCode,
      referralsCount,
      referralEarnings,
      selectedPlayerId,
      setSelectedPlayerId,
      buyPlayer,
      sellPlayer,
      listCardForSale,
      cancelP2PListing,
      buyP2PListing,
      createBet,
      acceptBet,
      craftGoldPlayer,
      forgeCard,
      assignRetiredTeam,
      depositFunds,
      withdrawFunds,
      simulateMatchDay,
      userTier,
      username,
      setUsername,
      userAvatar,
      setUserAvatar,
      isProfileOpen,
      setIsProfileOpen,
      isInfluencer,
      toggleInfluencer,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
