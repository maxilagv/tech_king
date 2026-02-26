import React from "react";
import { motion } from "framer-motion";

export default function ProductFilters({
  activeCategory,
  onCategoryChange,
  categories = [],
  includeOffers = false,
}) {
  const filters = [
    { key: "all", label: "Todos" },
    ...(includeOffers ? [{ key: "offers", label: "Ofertas" }] : []),
    ...categories.map((cat) => ({ key: cat.slug || cat.id, label: cat.nombre })),
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {filters.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onCategoryChange(cat.key)}
          className="relative px-5 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase transition-colors duration-300 overflow-hidden"
        >
          {activeCategory === cat.key && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg shadow-blue-500/30"
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
            />
          )}
          <span
            className={`relative z-10 font-medium ${
              activeCategory === cat.key ? "text-white" : "text-[#0A0A0A]/50 hover:text-blue-600"
            }`}
          >
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
