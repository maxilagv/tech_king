import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownAZ, ArrowUpAZ, ArrowDownNarrowWide, ArrowUpNarrowWide, SlidersHorizontal } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";

const SORT_OPTIONS = [
  { value: "default", label: "Relevancia" },
  { value: "az", label: "A → Z", Icon: ArrowDownAZ },
  { value: "za", label: "Z → A", Icon: ArrowUpAZ },
  { value: "price_asc", label: "Menor precio", Icon: ArrowDownNarrowWide },
  { value: "price_desc", label: "Mayor precio", Icon: ArrowUpNarrowWide },
];

export default function ProductFilters({
  activeCategory,
  onCategoryChange,
  categories = [],
  includeOffers = false,
  sortOrder = "default",
  onSortChange,
  priceMin = "",
  priceMax = "",
  onPriceChange,
}) {
  const reduceMotion = useShouldReduceMotion();
  const { isDark } = useTheme();

  const [localMin, setLocalMin] = useState(priceMin);
  const [localMax, setLocalMax] = useState(priceMax);
  const [sortOpen, setSortOpen] = useState(false);

  const filters = [
    { key: "all", label: "Todos" },
    ...(includeOffers ? [{ key: "offers", label: "Ofertas" }] : []),
    ...categories.map((cat) => ({ key: cat.slug || cat.id, label: cat.nombre })),
  ];

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortOrder)?.label ?? "Relevancia";

  const applyPrice = () => {
    onPriceChange?.(localMin, localMax);
  };

  const clearPrice = () => {
    setLocalMin("");
    setLocalMax("");
    onPriceChange?.("", "");
  };

  const hasPriceFilter = priceMin !== "" || priceMax !== "";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ── Category pills ── */}
      <div className="flex flex-wrap gap-2 justify-center">
        {filters.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className="relative px-5 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase transition-colors duration-300 overflow-hidden"
          >
            {activeCategory === cat.key && (
              <motion.div
                layoutId={reduceMotion ? undefined : "activeFilter"}
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full shadow-lg shadow-blue-500/30"
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
              />
            )}
            <span
              className={`relative z-10 font-medium ${
                activeCategory === cat.key
                  ? "text-white"
                  : isDark
                    ? "text-white/75 hover:text-white"
                    : "text-[#0A0A0A]/55 hover:text-blue-600"
              }`}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Sort + Price row ── */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
        {/* Sort dropdown */}
        <div className="relative">
          <button
            type="button"
            id="sort-trigger"
            onClick={() => setSortOpen((p) => !p)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs tracking-[0.12em] uppercase transition
              ${isDark
                ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                : "border-black/10 bg-white text-[#0A0A0A]/70 hover:bg-blue-50"
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeSortLabel}
          </button>

          {sortOpen && (
            <>
              {/* click-away overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div
                className={`absolute left-0 top-full mt-2 z-50 min-w-[170px] rounded-2xl border shadow-xl overflow-hidden ${
                  isDark ? "bg-[#111] border-white/10" : "bg-white border-black/8"
                }`}
              >
                {SORT_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  const active = sortOrder === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSortChange?.(opt.value);
                        setSortOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs uppercase tracking-[0.12em] transition text-left
                        ${active
                          ? "bg-blue-600 text-white"
                          : isDark
                            ? "text-white/75 hover:bg-white/8"
                            : "text-[#0A0A0A]/70 hover:bg-blue-50"
                        }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Price range inputs */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Precio mín"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className={`w-28 h-9 rounded-full border px-3 text-xs outline-none transition
              ${isDark
                ? "bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-blue-500"
                : "bg-white border-black/10 text-[#0A0A0A] placeholder:text-black/30 focus:border-blue-500"
              }`}
          />
          <span className={`text-xs ${isDark ? "text-white/40" : "text-black/30"}`}>—</span>
          <input
            type="number"
            min="0"
            placeholder="Precio máx"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className={`w-28 h-9 rounded-full border px-3 text-xs outline-none transition
              ${isDark
                ? "bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-blue-500"
                : "bg-white border-black/10 text-[#0A0A0A] placeholder:text-black/30 focus:border-blue-500"
              }`}
          />
          <button
            type="button"
            onClick={applyPrice}
            className="h-9 px-4 rounded-full bg-blue-600 text-white text-xs uppercase tracking-[0.12em] font-semibold hover:bg-blue-700 transition"
          >
            Aplicar
          </button>
          {hasPriceFilter && (
            <button
              type="button"
              onClick={clearPrice}
              className={`h-9 px-3 rounded-full border text-xs uppercase tracking-[0.12em] transition
                ${isDark
                  ? "border-white/15 text-white/60 hover:bg-white/8"
                  : "border-black/10 text-black/50 hover:bg-black/5"
                }`}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
