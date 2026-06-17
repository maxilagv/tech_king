import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownAZ,
  ArrowDownNarrowWide,
  ArrowUpAZ,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";

const SORT_OPTIONS = [
  { value: "default", label: "Relevancia" },
  { value: "az", label: "A -> Z", Icon: ArrowDownAZ },
  { value: "za", label: "Z -> A", Icon: ArrowUpAZ },
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
  const categoryRailRef = useRef(null);
  const arrowPointerHandledRef = useRef(false);
  const [localMin, setLocalMin] = useState(priceMin);
  const [localMax, setLocalMax] = useState(priceMax);
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryScroll, setCategoryScroll] = useState({ previous: false, next: false });

  useEffect(() => {
    setLocalMin(priceMin);
    setLocalMax(priceMax);
  }, [priceMin, priceMax]);

  const filters = [
    { key: "all", label: "Todos" },
    ...(includeOffers ? [{ key: "offers", label: "Ofertas" }] : []),
    ...categories.map((cat) => ({ key: cat.slug || cat.id, label: cat.nombre })),
  ];

  const activeSortLabel = SORT_OPTIONS.find((option) => option.value === sortOrder)?.label ?? "Relevancia";
  const hasPriceFilter = priceMin !== "" || priceMax !== "";

  const updateCategoryScroll = () => {
    const rail = categoryRailRef.current;
    if (!rail) return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setCategoryScroll({
      previous: rail.scrollLeft > 4,
      next: rail.scrollLeft < maxScroll - 4,
    });
  };

  useEffect(() => {
    const rail = categoryRailRef.current;
    const timeoutIds = [0, 120, 420].map((delay) => window.setTimeout(updateCategoryScroll, delay));
    const resizeObserver =
      rail && "ResizeObserver" in window ? new ResizeObserver(updateCategoryScroll) : null;

    resizeObserver?.observe(rail);
    window.addEventListener("resize", updateCategoryScroll);

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateCategoryScroll);
    };
  }, [filters.length]);

  useEffect(() => {
    const rail = categoryRailRef.current;
    if (!rail) return;

    const activeButton = rail.querySelector(`[data-category-key="${activeCategory}"]`);
    activeButton?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });

    const timeoutId = window.setTimeout(updateCategoryScroll, reduceMotion ? 0 : 260);
    return () => window.clearTimeout(timeoutId);
  }, [activeCategory, reduceMotion]);

  const scrollCategories = (direction) => {
    const rail = categoryRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * Math.max(260, Math.floor(rail.clientWidth * 0.72)),
      behavior: reduceMotion ? "auto" : "smooth",
    });
    window.setTimeout(updateCategoryScroll, reduceMotion ? 0 : 260);
  };

  const handleArrowPointerDown = (event, direction) => {
    event.preventDefault();
    arrowPointerHandledRef.current = true;
    scrollCategories(direction);
  };

  const handleArrowClick = (direction) => {
    if (arrowPointerHandledRef.current) {
      arrowPointerHandledRef.current = false;
      return;
    }
    scrollCategories(direction);
  };

  const applyPrice = () => {
    onPriceChange?.(localMin, localMax);
  };

  const clearPrice = () => {
    setLocalMin("");
    setLocalMax("");
    onPriceChange?.("", "");
  };

  return (
    <div className="relative z-20 w-full rounded-lg border tk-theme-border bg-[var(--tk-surface)] p-2.5 shadow-sm">
      <div className="relative">
        <div
          className={`pointer-events-none absolute inset-y-0 left-8 z-10 w-12 bg-gradient-to-r from-[var(--tk-surface)] to-transparent transition-opacity duration-300 ${
            categoryScroll.previous ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-8 z-10 w-12 bg-gradient-to-l from-[var(--tk-surface)] to-transparent transition-opacity duration-300 ${
            categoryScroll.next ? "opacity-100" : "opacity-0"
          }`}
        />
        <button
          type="button"
          onPointerDown={(event) => handleArrowPointerDown(event, -1)}
          onClick={() => handleArrowClick(-1)}
          disabled={!categoryScroll.previous}
          className={`absolute left-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-lg border tk-theme-border bg-[var(--tk-surface)] shadow-sm transition ${
            categoryScroll.previous
              ? isDark
                ? "text-white hover:bg-white/10"
                : "text-[#0A0A0A] hover:border-blue-400 hover:text-blue-600"
              : "pointer-events-none text-transparent opacity-0"
          }`}
          aria-label="Ver categorias anteriores"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={categoryRailRef}
          onScroll={updateCategoryScroll}
          data-category-rail="true"
          className="scrollbar-hide flex w-full items-center gap-2 overflow-x-auto scroll-smooth px-10 pb-2"
        >
          {filters.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                data-category-key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                className="relative shrink-0 overflow-hidden rounded-lg px-3.5 py-2 text-[10px] uppercase tracking-[0.14em] transition-colors duration-300"
              >
                {active && (
                  <motion.div
                    layoutId={reduceMotion ? undefined : "activeFilter"}
                    className="absolute inset-0 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20"
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
                  />
                )}
                <span
                  className={`relative z-10 font-bold ${
                    active
                      ? "text-white"
                      : isDark
                        ? "text-white/72 hover:text-white"
                        : "text-[#0A0A0A]/58 hover:text-blue-600"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onPointerDown={(event) => handleArrowPointerDown(event, 1)}
          onClick={() => handleArrowClick(1)}
          disabled={!categoryScroll.next}
          data-category-next="true"
          className={`absolute right-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-lg border tk-theme-border bg-[var(--tk-surface)] shadow-sm transition ${
            categoryScroll.next
              ? isDark
                ? "text-white hover:bg-white/10"
                : "text-[#0A0A0A] hover:border-blue-400 hover:text-blue-600"
              : "pointer-events-none text-transparent opacity-0"
          }`}
          aria-label="Ver mas categorias"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 border-t tk-theme-border pt-2.5 md:flex-row md:items-center md:justify-between">
        <div className="relative z-30">
          <button
            type="button"
            onClick={() => setSortOpen((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-xs uppercase tracking-[0.12em] transition ${
              isDark
                ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                : "border-black/10 bg-white text-[#0A0A0A]/70 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeSortLabel}
          </button>

          {sortOpen && (
            <>
              <div className="fixed inset-0 z-[70]" onClick={() => setSortOpen(false)} />
              <div
                className={`absolute left-0 top-full z-[80] mt-2 min-w-[190px] overflow-hidden rounded-lg border shadow-xl ${
                  isDark ? "border-white/10 bg-[#111]" : "border-black/8 bg-white"
                }`}
              >
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.Icon;
                  const active = sortOrder === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSortChange?.(option.value);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs uppercase tracking-[0.12em] transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : isDark
                            ? "text-white/75 hover:bg-white/8"
                            : "text-[#0A0A0A]/70 hover:bg-blue-50"
                      }`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Precio min"
            value={localMin}
            onChange={(event) => setLocalMin(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyPrice()}
            className={`tk-focus-glow h-9 w-28 rounded-lg border px-3 text-xs outline-none ${
              isDark
                ? "border-white/15 bg-white/5 text-white placeholder:text-white/30"
                : "border-black/10 bg-white text-[#0A0A0A] placeholder:text-black/30"
            }`}
          />
          <span className={`text-xs ${isDark ? "text-white/40" : "text-black/30"}`}>-</span>
          <input
            type="number"
            min="0"
            placeholder="Precio max"
            value={localMax}
            onChange={(event) => setLocalMax(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyPrice()}
            className={`tk-focus-glow h-9 w-28 rounded-lg border px-3 text-xs outline-none ${
              isDark
                ? "border-white/15 bg-white/5 text-white placeholder:text-white/30"
                : "border-black/10 bg-white text-[#0A0A0A] placeholder:text-black/30"
            }`}
          />
          <button
            type="button"
            onClick={applyPrice}
            className="tk-shine h-9 rounded-lg bg-blue-600 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-blue-700"
          >
            <span className="relative z-[2]">Aplicar</span>
          </button>
          {hasPriceFilter && (
            <button
              type="button"
              onClick={clearPrice}
              className={`h-9 rounded-lg border px-3 text-xs uppercase tracking-[0.12em] transition ${
                isDark
                  ? "border-white/15 text-white/60 hover:bg-white/8"
                  : "border-black/10 text-black/50 hover:bg-black/5"
              }`}
              aria-label="Limpiar rango de precio"
            >
              x
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
