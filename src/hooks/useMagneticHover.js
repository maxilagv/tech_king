import { useCallback, useEffect, useRef } from "react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

function isTouch() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: none)").matches
    : false;
}

/**
 * Magnetic hover: the element drifts toward the cursor (clamped).
 * Writes `transform` directly, rAF-throttled. Resets on leave.
 * Inert when motion is reduced or on touch devices.
 *
 * Usage:
 *   const magnetic = useMagneticHover({ strength: 0.35, max: 10 });
 *   <a ref={magnetic.ref} onMouseMove={magnetic.onMouseMove} onMouseLeave={magnetic.onMouseLeave}>
 */
export function useMagneticHover({ strength = 0.3, max = 12 } = {}) {
  const ref = useRef(null);
  const frame = useRef(0);
  const reduceMotion = useShouldReduceMotion();
  const inert = reduceMotion || isTouch();

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (inert && ref.current) {
      ref.current.style.transform = "";
    }
  }, [inert]);

  const onMouseMove = useCallback(
    (event) => {
      if (inert) return;
      const el = ref.current;
      if (!el) return;
      const x = event.clientX;
      const y = event.clientY;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const dx = x - (rect.left + rect.width / 2);
        const dy = y - (rect.top + rect.height / 2);
        const tx = Math.max(-max, Math.min(max, dx * strength));
        const ty = Math.max(-max, Math.min(max, dy * strength));
        el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
      });
    },
    [inert, strength, max]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transform = "";
  }, []);

  return { ref, onMouseMove, onMouseLeave, inert };
}
