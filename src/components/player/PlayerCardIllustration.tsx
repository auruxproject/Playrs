"use client";

export interface RarityPalette {
  a: string; // acento principal
  b: string; // acento secundario
}

interface PlayerCardIllustrationProps {
  /** Dato real y público si está disponible (nunca se inventa). */
  jerseyNumber?: number;
  /** Ticker real (ej. "MBP-RM") -- se usa como respaldo cuando no hay dorsal. */
  ticker: string;
  /** Apellido o nombre corto real del jugador. */
  lastName: string;
  palette: RarityPalette;
}

/**
 * Ilustración central 100% generativa (SVG): un emblema facetado abstracto,
 * sin fotos ni escudos con copyright. Comunica el dorsal (si existe como dato
 * real) o, en su defecto, el ticker -- nunca un número inventado -- más el
 * apellido del jugador, coloreado con el acento de rareza de la ficha.
 */
export function PlayerCardIllustration({ jerseyNumber, ticker, lastName, palette }: PlayerCardIllustrationProps) {
  const gradientId = `pci-grad-${ticker}`;
  const glowId = `pci-glow-${ticker}`;
  const displayValue = jerseyNumber != null ? String(jerseyNumber) : ticker;
  const isNumber = jerseyNumber != null;

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      role="img"
      aria-label={`Emblema de ${lastName}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor={palette.a} stopOpacity="0.95" />
          <stop offset="100%" stopColor={palette.b} stopOpacity="0.95" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Emblema facetado (hexágono irregular tipo gema, abstracto) */}
      <g filter={`url(#${glowId})`}>
        <polygon
          points="100,10 172,52 186,124 132,182 68,182 14,124 28,52"
          fill={`url(#${gradientId})`}
          fillOpacity="0.22"
          stroke={palette.a}
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
        {/* Facetas internas (líneas geométricas, sensación "low-poly") */}
        <g stroke={palette.a} strokeOpacity="0.3" strokeWidth="1">
          <line x1="100" y1="10" x2="100" y2="182" />
          <line x1="28" y1="52" x2="172" y2="52" />
          <line x1="14" y1="124" x2="186" y2="124" />
          <line x1="100" y1="10" x2="28" y2="52" />
          <line x1="100" y1="10" x2="172" y2="52" />
          <line x1="14" y1="124" x2="68" y2="182" />
          <line x1="186" y1="124" x2="132" y2="182" />
        </g>
        {/* Anillo exterior fino */}
        <polygon
          points="100,4 178,50 194,126 134,188 66,188 6,126 22,50"
          fill="none"
          stroke={palette.a}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      </g>

      {/* Dorsal / ticker */}
      <text
        x="100"
        y={isNumber ? "112" : "104"}
        textAnchor="middle"
        fontSize={isNumber ? "76" : "34"}
        fontWeight="900"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fill="white"
        fillOpacity="0.94"
        letterSpacing={isNumber ? "-2" : "1"}
      >
        {displayValue}
      </text>

      {/* Apellido, integrado en la ilustración (como en una camiseta real) */}
      <text
        x="100"
        y="146"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fill="white"
        fillOpacity="0.85"
        letterSpacing="3"
      >
        {lastName.toUpperCase()}
      </text>
    </svg>
  );
}
