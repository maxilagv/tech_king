import React from "react";
import { motion } from "framer-motion";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

/**
 * Lightweight scroll-reveal wrapper (fade + slight rise).
 * For NEW / simple sections only — do not wrap nodes already driven by the
 * tuned GSAP ScrollTrigger reveals, or they will double-animate.
 */
export function Reveal({
  children,
  y = 24,
  delay = 0,
  once = true,
  amount = 0.25,
  duration = 0.55,
  className = "",
  as = "div",
  ...rest
}) {
  const reduceMotion = useShouldReduceMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export default Reveal;
