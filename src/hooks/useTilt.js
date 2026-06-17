import { useCallback, useEffect, useRef } from "react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

function isTouch() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: none)").matches
    : false;
}

/**
 * 3D tilt-on-hover. Apply the ref to the element that should rotate
 * (use an inner media wrapper, never a GSAP-target node).
 * Writes `transform` directly (compositor-friendly), rAF-throttled.
 * Inert when motion is reduced, on touch devices, or while `disabled`.
 *
 * Usage:
 *   const tilt = useTilt({ max: 8, scale: 1.03 });
 *   <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
 */
export function useTilt({ max = 8, scale = 1.02, disabled = false } = {}) {
  const ref = useRef(null);
  const frame = useRef(0);
  const reduceMotion = useShouldReduceMotion();
  const inert = reduceMotion || disabled || isTouch();

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    // Reset transform if the effect becomes inert (e.g. zoom opens, motion off).
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
        const px = (x - rect.left) / rect.width - 0.5;
        const py = (y - rect.top) / rect.height - 0.5;
        const rotY = px * max * 2;
        const rotX = -py * max * 2;
        el.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale})`;
      });
    },
    [inert, max, scale]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transform = "";
  }, []);

  return { ref, onMouseMove, onMouseLeave, inert };
}
