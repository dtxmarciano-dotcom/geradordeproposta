import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-vantta-400 focus:border-transparent ${
            error ? "border-red-400" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {error ? (
          <span id={errorId} className="text-xs text-red-500">
            {error}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
