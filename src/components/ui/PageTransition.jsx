import React from "react";
import { motion } from "framer-motion";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

/**
 * Short fade-in on route change. Keyed by `routeKey` (pathname) so it remounts
 * per page. Fade-IN only — no exit transform — so it never delays unmount or
 * double-fires GSAP/ScrollTrigger on the pages that use it. Inert under
 * reduced-motion.
 */
export function PageTransition({ children, routeKey }) {
  const reduceMotion = useShouldReduceMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
