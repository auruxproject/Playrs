"use client";

import { Badge } from "@/components/ui/Badge";
import { PriceDisplay } from "@/components/ui/PriceDisplay";

interface PlayerCardProps {
  ticker: string;
  name: string;
  team: string;
  position: "GK" | "DF" | "MD" | "FW";
  price: number;
  change: number;
  stock?: number;
  maxStock?: number;
  streak?: number;
  isGold?: boolean;
  tier?: "standard" | "silver" | "gold" | "diamond" | "legend";
  isFrozen?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
  rating?: number; // 0 to 5 rating scale
}

const positionLabels = {
  GK: "POR",
  DF: "DEF",
  MD: "MED",
  FW: "DEL",
};

const positionColors = {
  GK: "warning",
  DF: "purple",
  MD: "blue",
  FW: "success",
} as const;

export function PlayerCard({
  ticker,
  name,
  team,
  position,
  price,
  change,
  stock,
  maxStock,
  streak,
  isGold = false,
  tier,
  isFrozen = false,
  onClick,
  onInfoClick,
  rating,
}: PlayerCardProps) {
  
  const cardTier = tier || (isGold ? "gold" : "standard");

  // Custom abstract avatar representation (inspired by premium digital cards)
  const getInitials = (fullName: string) => {
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // Club colors to style the avatar backdrop
  const getClubGradient = () => {
    if (team.includes("Real Madrid")) return "from-slate-700 via-slate-800 to-slate-900";
    if (team.includes("Man City")) return "from-sky-700 via-sky-800 to-sky-950";
    if (team.includes("Barcelona")) return "from-rose-800 via-blue-900 to-indigo-950";
    if (team.includes("Liverpool")) return "from-red-800 via-red-950 to-zinc-950";
    return "from-zinc-800 via-zinc-900 to-black";
  };

  // Tier specific card layouts
  const getTierStyles = () => {
    switch (cardTier) {
      case "silver":
        return {
          cardBg: "bg-gradient-to-br from-slate-700/30 via-background-secondary to-black border-slate-400/40 shadow-[0_0_12px_rgba(148,163,184,0.08)]",
          headerBg: "bg-gradient-to-r from-slate-400/20 via-slate-600/10 to-transparent text-slate-300",
          headerLabel: "PLATA",
          ringColor: "border-slate-400/30",
          avatarBg: "from-slate-400 via-slate-500 to-slate-700 border-slate-400",
          stripe: "from-slate-300 to-slate-500",
          avatarText: "text-background",
          headerPulse: ""
        };
      case "gold":
        return {
          cardBg: "bg-gradient-to-br from-gold-dark/40 via-background-secondary to-black border-gold/50 shadow-glow-gold/10",
          headerBg: "bg-gradient-to-r from-gold/20 via-gold-dark/10 to-transparent text-gold",
          headerLabel: "ORO ÉLITE",
          ringColor: "border-gold/30",
          avatarBg: "from-gold via-gold-dark to-yellow-900 border-gold",
          stripe: "from-yellow-400 to-amber-600",
          avatarText: "text-background",
          headerPulse: ""
        };
      case "diamond":
        return {
          cardBg: "bg-gradient-to-br from-cyan-900/40 via-background-secondary to-black border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
          headerBg: "bg-gradient-to-r from-cyan-500/20 via-cyan-700/10 to-transparent text-cyan-400",
          headerLabel: "DIAMANTE",
          ringColor: "border-cyan-400/30",
          avatarBg: "from-cyan-400 via-cyan-500 to-cyan-700 border-cyan-400",
          stripe: "from-cyan-300 to-cyan-600",
          avatarText: "text-background",
          headerPulse: ""
        };
      case "legend":
        return {
          cardBg: "bg-gradient-to-br from-fuchsia-950/40 via-background-secondary to-black border-fuchsia-500/60 shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-pulse-slow",
          headerBg: "bg-gradient-to-r from-fuchsia-500/35 via-purple-600/20 to-transparent text-fuchsia-400",
          headerLabel: "LEYENDA",
          ringColor: "border-fuchsia-500/30",
          avatarBg: "from-fuchsia-500 via-purple-600 to-indigo-900 border-fuchsia-500",
          stripe: "from-fuchsia-400 to-purple-600",
          avatarText: "text-white",
          headerPulse: "animate-pulse"
        };
      case "standard":
      default:
        return {
          cardBg: "bg-gradient-to-br from-background-secondary via-background-secondary to-background-tertiary",
          headerBg: "bg-white/5 text-text-tertiary",
          headerLabel: "ESTÁNDAR",
          ringColor: "border-white/10",
          avatarBg: getClubGradient() + " border-white/15",
          stripe: "from-blue to-purple",
          avatarText: "text-white",
          headerPulse: ""
        };
    }
  };

  const styles = getTierStyles();

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex flex-col w-full aspect-[3/4.2] rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-500 select-none border border-white/10
        ${isFrozen ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-2 hover:shadow-strong"}
        ${styles.cardBg}
      `}
    >
      {/* Gloss reflection shine effect on hover (Inspired by premium cards) */}
      <div className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out pointer-events-none z-20" />

      {/* Card Season Tag / Rarity Background Header */}
      <div
        className={`px-3 py-1 flex items-center justify-between z-10 text-[9px] font-mono font-bold tracking-widest border-b border-white/5 ${styles.headerBg}`}
      >
        <span>VS - 26/27</span>
        <div className="flex items-center gap-1.5">
          <span className={`uppercase ${styles.headerPulse}`}>{styles.headerLabel}</span>
          {onInfoClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
              className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              title="Ver perfil completo"
            >
              <svg className="w-2.5 h-2.5 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Card Content Core */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 z-10">
        
        {/* Top bar: Position and Streak */}
        <div className="w-full flex items-center justify-between">
          <Badge variant={positionColors[position]} size="sm">
            {positionLabels[position]}
          </Badge>
          <div className="flex gap-1">
            {streak !== undefined && streak >= 3 && (
              <Badge variant="fire" size="sm">
                🔥 {streak}
              </Badge>
            )}
          </div>
        </div>

        {/* Central Collectible Avatar representation */}
        <div className="relative my-2 w-28 h-28 flex items-center justify-center shrink-0">
          {/* Outer glowing ring */}
          <div
            className={`absolute inset-0 rounded-full border border-dashed animate-spin ${styles.ringColor}`}
            style={{ animationDuration: "25s" }}
          />

          {/* Core avatar body */}
          <div
            className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${styles.avatarBg} border-2 shadow-medium overflow-hidden flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500`}
          >
            {/* Holographic background line */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            
            <span className={`text-2xl font-sans font-black tracking-tighter ${styles.avatarText}`}>
              {getInitials(name)}
            </span>
            <span className={`text-[8px] font-mono mt-0.5 font-bold ${cardTier !== "standard" ? "text-background/80" : "text-text-secondary"}`}>
              {ticker}
            </span>

            {/* Tactical jersey stripe representation */}
            <div className={`absolute bottom-0 w-full h-1 bg-gradient-to-r ${styles.stripe}`} />
          </div>
        </div>

        {/* Player Name and Club details */}
        <div className="text-center w-full">
          <h4 className="text-sm font-sans font-bold text-text-primary group-hover:text-blue transition-colors truncate">
            {name}
          </h4>
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider block mt-0.5">
            {team}
          </span>
          {rating !== undefined && (
            <div className="flex items-center justify-center gap-0.5 mt-1 text-[10px]">
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="leading-none">
                    {i < Math.round(rating) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-[8px] text-text-tertiary font-mono ml-1">({rating.toFixed(1)}/5)</span>
            </div>
          )}
        </div>

        {/* Price Tag Footer */}
        <div className="w-full pt-3 border-t border-white/5 flex items-center justify-between font-mono-nums">
          <div className="text-left">
            <span className="block text-[8px] text-text-tertiary uppercase font-mono">Valor Ficha</span>
            <span className="text-sm font-bold text-text-primary">${price.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="block text-[8px] text-text-tertiary uppercase font-mono">Cambio</span>
            <span
              className={`text-xs font-bold ${
                change >= 0 ? "text-green" : "text-red"
              }`}
            >
              {change >= 0 ? "▲ +" : "▼ "}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stock remaining overlay bar (inspired by Sorare's remaining supplies) */}
      {stock !== undefined && maxStock !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-background-tertiary">
          <div
            className={`h-full transition-all duration-500 ${
              cardTier !== "standard" ? "bg-gold" : "bg-blue"
            }`}
            style={{ width: `${(stock / maxStock) * 100}%` }}
          />
        </div>
      )}

      {/* Frozen/Match Lock overlay */}
      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30 animate-fadeIn">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-background-secondary border border-border shadow-strong">
            <span className="text-2xl">🔒</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary font-mono">
              Match Lock
            </span>
            <span className="text-[8px] text-text-tertiary">Partido en Vivo</span>
          </div>
        </div>
      )}
    </div>
  );
}
