interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "green" | "gold" | "red";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    blue: "bg-gradient-to-r from-blue to-purple",
    green: "bg-gradient-to-r from-green to-green-dark",
    gold: "bg-gradient-to-r from-gold to-gold-dark",
    red: "bg-gradient-to-r from-red to-red-dark",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-background-tertiary rounded-full ${sizes[size]}`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-tertiary">{value} / {max}</span>
          <span className="text-xs text-text-secondary font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
