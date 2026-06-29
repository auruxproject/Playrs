interface PriceDisplayProps {
  price: number;
  change?: number;
  size?: "sm" | "md" | "lg";
  showSign?: boolean;
}

export function PriceDisplay({
  price,
  change,
  size = "md",
  showSign = true,
}: PriceDisplayProps) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const changeSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="flex flex-col">
      <span className={`font-mono-nums font-bold ${sizes[size]}`}>
        ${price.toFixed(2)} USDC
      </span>
      {change !== undefined && (
        <span
          className={`font-mono-nums font-medium ${changeSizes[size]} ${
            isPositive ? "text-green" : isNegative ? "text-red" : "text-text-secondary"
          }`}
        >
          {showSign && isPositive && "+"}
          {change.toFixed(2)}%
        </span>
      )}
    </div>
  );
}
