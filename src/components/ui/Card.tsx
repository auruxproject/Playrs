import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  variant = "default",
  padding = "md",
  onClick,
}: CardProps) {
  const baseStyles = "rounded-2xl border border-border transition-all duration-300";

  const variants = {
    default: "bg-background-secondary",
    elevated: "bg-background-secondary shadow-medium",
    interactive: "bg-background-secondary hover:shadow-medium hover:-translate-y-1",
  };

  const paddings = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
