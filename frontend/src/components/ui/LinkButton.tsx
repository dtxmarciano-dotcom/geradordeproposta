import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-vantta-500 text-white hover:bg-vantta-600 active:bg-vantta-700 shadow-sm shadow-vantta-900/10",
  secondary: "bg-surface text-foreground border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3",
};

interface LinkButtonProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

// Link estilizado como botão — usado quando a ação principal navega para
// outra rota (ex.: "Nova lista"), mantendo a mesma linguagem visual do
// componente Button sem aninhar um <button> dentro de um <a>.
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantta-400 focus-visible:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
      {...props}
    />
  );
}
