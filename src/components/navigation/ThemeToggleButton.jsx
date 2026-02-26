import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggleButton({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      className={`group inline-flex items-center justify-center rounded-full border transition-all duration-300 ${
        compact
          ? "w-9 h-9 border-[var(--tk-border-strong)] bg-[var(--tk-surface-elevated)] text-[var(--tk-text)]"
          : "w-10 h-10 border-[var(--tk-border-strong)] bg-[var(--tk-surface-elevated)] text-[var(--tk-text)]"
      } hover:border-blue-500/50 hover:text-blue-500`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
