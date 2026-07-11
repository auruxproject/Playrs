"use client";

import { useRef } from "react";
import { PlayerCardIllustration, type RarityPalette } from "./PlayerCardIllustration";

export type CardTier = "standard" | "silver" | "gold" | "diamond" | "legend";

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
  tier?: CardTier;
  isFrozen?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
  /** Rating 0-5. Se muestra "—" si no está disponible -- nunca se inventa. */
  rating?: number;
  /** Nacionalidad real, ej. "Francia 🇫🇷" -- se extrae solo el emoji de bandera. */
  nationality?: string;
  /** Edad real. "—" si no está disponible. */
  age?: number;
  /** Valor de mercado real (ej. "€180M"). "—" si no está disponible. */
  marketValue?: string;
  /** Dorsal real, si existe como dato en el catálogo. Nunca se inventa. */
  jerseyNumber?: number;
}

const positionLabels = { GK: "POR", DF: "DEF", MD: "MED", FW: "DEL" };
const positionColors: Record<string, string> = {
  GK: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DF: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  MD: "bg-blue/15 text-blue border-blue/30",
  FW: "bg-green/15 text-green border-green/30",
};

const RARITY: Record<CardTier, {
  label: string;
  palette: RarityPalette;
  cardBg: string;
  ring: string;
  foil: boolean;
  dotFilled: number;
}> = {
  standard: {
    label: "ESTÁNDAR",
    palette: { a: "#4c8dff", b: "#22406e" },
    cardBg: "linear-gradient(165deg, #16233b 0%, #0a1019 100%)",
    ring: "rgba(76,141,255,0.35)",
    foil: false,
    dotFilled: 1,
  },
  silver: {
    label: "PLATA",
    palette: { a: "#dbe4f2", b: "#8fa4c0" },
    cardBg: "linear-gradient(165deg, #2a3646 0%, #0d131c 100%)",
    ring: "rgba(219,228,242,0.35)",
    foil: true,
    dotFilled: 2,
  },
  gold: {
    label: "ORO ÉLITE",
    palette: { a: "#f3b23c", b: "#7a5410" },
    cardBg: "linear-gradient(165deg, #3a2f14 0%, #140f05 100%)",
    ring: "rgba(243,178,60,0.4)",
    foil: true,
    dotFilled: 3,
  },
  diamond: {
    label: "DIAMANTE",
    palette: { a: "#5ef0d8", b: "#1f6f74" },
    cardBg: "linear-gradient(165deg, #0f3944 0%, #06131a 100%)",
    ring: "rgba(94,240,216,0.4)",
    foil: true,
    dotFilled: 4,
  },
  legend: {
    label: "LEYENDA",
    palette: { a: "#c86bff", b: "#7a2bd6" },
    cardBg: "linear-gradient(165deg, #191033 0%, #0a0714 100%)",
    ring: "rgba(200,107,255,0.45)",
    foil: true,
    dotFilled: 5,
  },
};

function getFlagEmoji(nationality?: string): string | null {
  if (!nationality) return null;
  const match = nationality.match(/\p{Regional_Indicator}{2}/u);
  return match ? match[0] : null;
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts[parts.length - 1];
}

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
  nationality,
  age,
  marketValue,
  jerseyNumber,
}: PlayerCardProps) {
  const cardTier: CardTier = tier || (isGold ? "gold" : "standard");
  const r = RARITY[cardTier];
  const cardRef = useRef<HTMLDivElement>(null);
  const flag = getFlagEmoji(nationality);

  // Tilt 3D + foil/glare posicionados en el cursor -- se actualiza vía ref
  // directo (sin re-render) para que el seguimiento del mouse sea fluido.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el || isFrozen) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * 32; // hasta ±16°
    const rotateX = (0.5 - py) * 32;
    el.style.setProperty("--rx", `${rotateX}deg`);
    el.style.setProperty("--ry", `${rotateY}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      // El contenedor de la perspectiva debe ser el PADRE del elemento que
      // rota (no el mismo nodo) para que el tilt 3D se vea correcto.
      className="w-full [perspective:1200px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        group relative flex flex-col w-full aspect-[3/4.25] rounded-2xl overflow-hidden select-none
        border border-white/10 [transform-style:preserve-3d]
        transition-[transform,opacity] duration-150 ease-out
        ${isFrozen ? "cursor-not-allowed opacity-50 pointer-events-none" : "cursor-pointer"}
      `}
      style={{
        background: r.cardBg,
        boxShadow: `0 24px 48px -18px rgba(0,0,0,.7), inset 0 0 0 1px ${r.ring}`,
        transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
      }}
    >
      {/* Barrido de luz ambiental en reposo -- corre siempre, sin necesitar cursor */}
      <div
        className="absolute inset-y-0 -left-1/2 w-1/2 pointer-events-none z-10 animate-card-sweep"
        style={{ background: "linear-gradient(115deg, transparent, rgba(255,255,255,0.35), transparent)" }}
      />

      {/* Glare: brillo blanco radial en la posición del cursor */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: "radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.35), transparent 45%)",
        }}
      />

      {/* Foil holográfico -- solo Plata en adelante */}
      {r.foil && (
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-[0.26] transition-opacity duration-300"
          style={{
            background:
              "conic-gradient(from 0deg at var(--mx,50%) var(--my,50%), #ff8bd6, #ffe08b, #8bffe6, #8bb4ff, #c78bff, #ff8bd6)",
            mixBlendMode: "color-dodge",
          }}
        />
      )}

      {/* Header */}
      <div className="px-3 py-1.5 flex items-center justify-between z-30 text-[9px] font-mono font-bold tracking-widest border-b border-white/10 text-white/70">
        <span>VS · 26/27</span>
        <div className="flex items-center gap-1.5">
          <span style={{ color: r.palette.a }}>{r.label}</span>
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

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col items-center justify-between px-3 pt-2 pb-3 z-30">
        {/* Fila superior: posición + racha/bandera */}
        <div className="w-full flex items-center justify-between">
          <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-mono font-bold ${positionColors[position]}`}>
            {positionLabels[position]}
          </span>
          <div className="flex items-center gap-1">
            {streak !== undefined && streak >= 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-[9px] font-mono font-bold text-orange-400">
                🔥 {streak}
              </span>
            )}
            {flag && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] leading-none">
                {flag}
              </span>
            )}
          </div>
        </div>

        {/* Ilustración central */}
        <div className="w-[88%] aspect-square flex items-center justify-center my-1">
          <PlayerCardIllustration
            jerseyNumber={jerseyNumber}
            ticker={ticker}
            lastName={getLastName(name)}
            palette={r.palette}
          />
        </div>

        {/* Nombre + club */}
        <div className="text-center w-full">
          <h4 className="text-sm font-bold text-white truncate">{name}</h4>
          <span className="text-[9px] text-white/50 uppercase tracking-widest block mt-0.5">
            {team}
          </span>
        </div>

        {/* Mini panel de stats: Rating / Edad / Valor */}
        <div className="w-full grid grid-cols-3 gap-1 mt-2">
          {[
            { label: "RATING", value: rating !== undefined ? rating.toFixed(1) : "—" },
            { label: "EDAD", value: age !== undefined ? String(age) : "—" },
            { label: "VALOR", value: marketValue ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg py-1 text-center">
              <div className="text-[7px] font-mono text-white/40 uppercase tracking-wider">{s.label}</div>
              <div className="text-[10px] font-bold text-white/90 font-mono-nums">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Footer: precio + puntos de rareza / cambio */}
        <div className="w-full pt-2 mt-2 border-t border-white/10 flex items-end justify-between font-mono-nums">
          <div className="text-left">
            <span className="text-sm font-bold text-white">${price.toFixed(2)}</span>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: i < r.dotFilled ? r.palette.a : "rgba(255,255,255,0.15)" }}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold ${change >= 0 ? "text-green" : "text-red"}`}>
              {change >= 0 ? "▲ +" : "▼ "}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Barra de stock restante */}
      {stock !== undefined && maxStock !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-30">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(stock / maxStock) * 100}%`,
              background: `linear-gradient(90deg, ${r.palette.a}, ${r.palette.b})`,
            }}
          />
        </div>
      )}

      {/* Overlay de partido en vivo (Match Lock) */}
      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40 animate-fadeIn">
          <div className="flex flex-col items-center gap-1 opacity-90">
            <span className="text-2xl">🔒</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white font-mono">
              Match Lock
            </span>
            <span className="text-[8px] text-white/60">Partido en Vivo</span>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
