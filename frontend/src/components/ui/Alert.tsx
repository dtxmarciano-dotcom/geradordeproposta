import { HTMLAttributes } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  success: "bg-vantta-50 border-vantta-200 text-vantta-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-sky-50 border-sky-200 text-sky-800",
};

export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${variantClasses[variant]} ${className ?? ""}`}
      role="alert"
      {...props}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
    </div>
  );
}
