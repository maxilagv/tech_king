import { useCallback, useEffect, useRef } from "react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

/**
 * Cursor-following spotlight glow.
 * Pairs with the `.tk-spotlight` utility (renders a radial `::before`).
 * Writes `--tk-mx` / `--tk-my` (px) on the element, rAF-throttled.
 * Never sets React state. Inert when motion is reduced.
 *
 * Usage:
 *   const spotlight = useSpotlight();
 *   <div ref={spotlight.ref} onMouseMove={spotlight.onMouseMove} className="tk-spotlight">
 */
export function useSpotlight() {
  const ref = useRef(null);
  const frame = useRef(0);
  const reduceMotion = useShouldReduceMotion();

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  const onMouseMove = useCallback(
    (event) => {
      if (reduceMotion) return;
      const el = ref.current;
      if (!el) return;
      const x = event.clientX;
      const y = event.clientY;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--tk-mx", `${x - rect.left}px`);
        el.style.setProperty("--tk-my", `${y - rect.top}px`);
      });
    },
    [reduceMotion]
  );

  return { ref, onMouseMove };
}
