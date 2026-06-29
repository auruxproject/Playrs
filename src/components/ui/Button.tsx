import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "buy" | "sell" | "fire" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue to-purple text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5",
    buy: "bg-gradient-to-r from-green to-green-dark text-white shadow-[0_4px_16px_rgba(0,214,143,0.3)] hover:shadow-[0_6px_20px_rgba(0,214,143,0.4)] hover:-translate-y-0.5",
    sell: "bg-gradient-to-r from-red to-red-dark text-white shadow-[0_4px_16px_rgba(255,71,87,0.3)] hover:shadow-[0_6px_20px_rgba(255,71,87,0.4)] hover:-translate-y-0.5",
    fire: "bg-gradient-to-r from-gold via-red to-gold text-white shadow-[0_4px_16px_rgba(245,158,11,0.3)]",
    secondary: "bg-background-tertiary text-text-primary border border-border hover:bg-border",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-background-tertiary",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
