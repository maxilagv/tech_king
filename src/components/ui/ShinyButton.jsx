import React from "react";
import { Link } from "react-router-dom";
import { useMagneticHover } from "@/hooks/useMagneticHover";

const VARIANTS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25",
  outline: "border tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]",
  ghost: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
  light: "bg-white text-[#07111f] hover:bg-blue-50 shadow-[0_18px_50px_rgba(0,0,0,0.18)]",
};

/**
 * Button/Link with a sheen sweep on hover (`.tk-shine`) + pressable feedback.
 * Optionally magnetic (drifts toward the cursor, auto-disabled on touch/reduced-motion).
 *
 * Renders a <Link> when `to` is provided, an <a> when `href` is provided,
 * otherwise a <button>.
 */
export function ShinyButton({
  children,
  variant = "primary",
  magnetic = false,
  to,
  href,
  className = "",
  type = "button",
  ...rest
}) {
  const mag = useMagneticHover({ strength: 0.25, max: 8 });
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const classes = `tk-shine tk-pressable inline-flex items-center justify-center gap-2 rounded-lg transition-colors ${variantClass} ${className}`;

  const magneticProps =
    magnetic && !mag.inert
      ? { ref: mag.ref, onMouseMove: mag.onMouseMove, onMouseLeave: mag.onMouseLeave }
      : {};

  if (to) {
    return (
      <Link to={to} className={classes} {...magneticProps} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...magneticProps} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...magneticProps} {...rest}>
      {children}
    </button>
  );
}

export default ShinyButton;
