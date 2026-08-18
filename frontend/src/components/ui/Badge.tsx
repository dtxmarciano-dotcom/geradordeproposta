import { HTMLAttributes } from "react";

type BadgeVariant = "neutral" | "success" | "info" | "warning";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  success: "bg-vantta-100 text-vantta-800",
  info: "bg-sky-100 text-sky-800",
  warning: "bg-amber-100 text-amber-800",
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
