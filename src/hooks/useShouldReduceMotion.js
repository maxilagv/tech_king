import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

function getPerformanceReducedFallback() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const attr = document.documentElement.getAttribute("data-performance");
  if (attr === "reduced") return true;
  if (attr === "full") return false;

  const nav = window.navigator || {};
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const isNarrowViewport =
    typeof window.matchMedia === "function" && window.matchMedia("(max-width: 640px)").matches;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = String(connection?.effectiveType || "").toLowerCase();
  const slowConnection = effectiveType === "slow-2g" || effectiveType === "2g";
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  return Boolean(isNarrowViewport || saveData || slowConnection || lowMemory || lowCpu);
}

export function useShouldReduceMotion() {
  const reducedMotion = useReducedMotion();
  const [isPerformanceReduced, setIsPerformanceReduced] = useState(getPerformanceReducedFallback);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => {
      setIsPerformanceReduced(root.getAttribute("data-performance") === "reduced");
    };
    update();

    if (typeof MutationObserver === "undefined") return undefined;
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-performance"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVisibilityChange = () => {
      if (!document.hidden) {
        setIsPerformanceReduced(
          document.documentElement.getAttribute("data-performance") === "reduced"
        );
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return Boolean(reducedMotion || isPerformanceReduced);
}
