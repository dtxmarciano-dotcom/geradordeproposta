interface VanttaLogoProps {
  variant?: "full" | "icon";
  theme?: "light" | "dark";
  className?: string;
}

/**
 * Approximation of the Vantta brand mark: a minimalist "V" built from two
 * angled strokes, the left one solid light green and the right one a darker
 * green gradient, evoking "two prices meeting at the best deal". Not a
 * pixel-perfect reproduction of the original logo, just a reasonable
 * vector stand-in that captures the identity (green gradient V + bold
 * wordmark).
 */
export function VanttaLogo({
  variant = "full",
  theme = "light",
  className,
}: VanttaLogoProps) {
  const gradientId = `vantta-v-gradient-${theme}`;
  const textColor = theme === "dark" ? "#ffffff" : "#0F2419";
  const strokeLight = theme === "dark" ? "#ffffff" : "#34D399";
  const strokeDarkStart = theme === "dark" ? "#ffffff" : "#22C55E";
  const strokeDarkEnd = theme === "dark" ? "#ffffff" : "#15803D";
  const rightOpacity = theme === "dark" ? 0.65 : 1;

  const icon = (
    <svg
      viewBox="0 0 40 40"
      width="32"
      height="32"
      fill="none"
      role="img"
      aria-label="Vantta"
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={strokeDarkStart} />
          <stop offset="1" stopColor={strokeDarkEnd} />
        </linearGradient>
      </defs>
      <polygon points="7,8 14,8 20,24 16,32" fill={strokeLight} />
      <polygon points="33,8 26,8 20,24 24,32" fill={`url(#${gradientId})`} opacity={rightOpacity} />
    </svg>
  );

  if (variant === "icon") {
    return <span className={className}>{icon}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {icon}
      <span
        className="text-xl font-bold tracking-tight"
        style={{ color: textColor }}
      >
        Vantta
      </span>
    </span>
  );
}
