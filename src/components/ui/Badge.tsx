interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "gold" | "fire" | "purple" | "blue" | "info";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-lg";

  const variants = {
    default: "bg-background-tertiary text-text-secondary",
    success: "bg-green/20 text-green",
    danger: "bg-red/20 text-red",
    warning: "bg-gold/20 text-gold",
    gold: "bg-gradient-to-r from-gold to-gold-dark text-white",
    fire: "bg-gradient-to-r from-gold via-red to-gold text-white",
    purple: "bg-purple/20 text-purple",
    blue: "bg-blue/20 text-blue",
    info: "bg-blue/20 text-blue",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
