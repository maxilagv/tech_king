import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function useShouldReduceMotion() {
  const reducedMotion = useReducedMotion();
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobileViewport(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return Boolean(reducedMotion || isMobileViewport);
}
