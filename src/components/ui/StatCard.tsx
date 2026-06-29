import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  const trendColors = {
    up: "text-green",
    down: "text-red",
    neutral: "text-text-secondary",
  };

  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        {icon && <span className="text-text-tertiary">{icon}</span>}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold font-mono-nums text-text-primary">
          {value}
        </span>
        {trend && trendValue && (
          <span className={`ml-2 text-sm font-medium ${trendColors[trend]}`}>
            {trend === "up" && "+"}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
