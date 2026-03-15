import React from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";

export default function BackToTopButton() {
  const reduceMotion = useShouldReduceMotion();
  const { isDark } = useTheme();

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <motion.button
      type="button"
      onClick={handleBackToTop}
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
      transition={reduceMotion ? undefined : { duration: 0.2 }}
      className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-colors ${
        isDark
          ? "border-white/10 bg-[#071530]/92 text-white shadow-black/30 hover:bg-[#0c1c40]"
          : "border-blue-200/70 bg-white/95 text-blue-700 shadow-blue-900/15 hover:bg-blue-50"
      }`}
      aria-label="Volver arriba"
      title="Volver arriba"
    >
      <ArrowUp className="h-5 w-5" />
    </motion.button>
  );
}
