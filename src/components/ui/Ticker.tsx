import { type ReactNode } from "react";

interface TickerItem {
  label: string;
  value: number;
  change: number;
}

interface TickerProps {
  items: TickerItem[];
}

export function Ticker({ items }: TickerProps) {
  return (
    <div className="w-full overflow-hidden bg-background-secondary border-b border-border">
      <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-3 px-6 py-2 border-r border-border"
          >
            <span className="text-sm font-medium text-text-primary">
              {item.label}
            </span>
            <span className="font-mono-nums text-sm text-text-secondary">
              ${item.value.toFixed(2)}
            </span>
            <span
              className={`font-mono-nums text-sm font-medium ${
                item.change > 0 ? "text-green" : item.change < 0 ? "text-red" : "text-text-secondary"
              }`}
            >
              {item.change > 0 ? "+" : ""}{item.change.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
