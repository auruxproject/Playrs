import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-background-secondary border rounded-xl px-4 py-3
              text-text-primary text-base
              placeholder:text-text-tertiary
              focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${error ? "border-red" : "border-border"}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red">{error}</p>}
        {hint && !error && <p className="text-sm text-text-tertiary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
