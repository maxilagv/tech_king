import React from "react";

/**
 * Wraps children in a gradient (optionally animated) border that uses the same
 * 1px box as regular borders — no layout shift. Theme-aware via `--tk-*`.
 */
export function GradientBorder({
  children,
  animated = false,
  radius = "rounded-lg",
  className = "",
  as: Tag = "div",
  ...rest
}) {
  const animatedClass = animated ? "tk-gradient-border-animated" : "";
  return (
    <Tag className={`tk-gradient-border ${animatedClass} ${radius} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export default GradientBorder;
