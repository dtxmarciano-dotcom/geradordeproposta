import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-vantta-500 text-white hover:bg-vantta-600 active:bg-vantta-700 shadow-sm shadow-vantta-900/10",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantta-400 focus-visible:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
