import React from "react";
import { motion } from "framer-motion";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

const BRANDS = [
  { name: "Samsung", color: "#1428A0" },
  { name: "Apple", color: "#555555" },
  { name: "Xiaomi", color: "#FF6900" },
  { name: "JBL", color: "#F37A21" },
  { name: "Motorola", color: "#0071CE" },
  { name: "Sony", color: "#003087" },
  { name: "LG", color: "#A50034" },
  { name: "Huawei", color: "#CF0A2C" },
  { name: "Anker", color: "#0070CC" },
  { name: "Baseus", color: "#0078FF" },
  { name: "Philips", color: "#0070C1" },
  { name: "Belkin", color: "#004B87" },
];

// Triple para asegurar loop sin saltos visibles en viewports pequeños
const TRACK = [...BRANDS, ...BRANDS, ...BRANDS];

function BrandCard({ brand }) {
  return (
    <div className="flex items-center justify-center min-w-[100px] sm:min-w-[130px] md:min-w-[150px] h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 sm:px-5 md:px-6 hover:border-blue-300/30 hover:bg-white/10 transition-all duration-300 group select-none">
      <span
        className="text-sm sm:text-base md:text-lg font-bold tracking-tight opacity-55 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
        style={{ color: brand.color, filter: "saturate(0.65)" }}
      >
        {brand.name}
      </span>
    </div>
  );
}

export default function BrandsSection() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="py-12 md:py-16 px-0 tk-theme-bg border-y tk-theme-border overflow-hidden">
      {/* Título */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 mb-8 md:mb-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={reduceMotion ? undefined : { duration: 0.5 }}
          className="text-center"
        >
          <span className="text-blue-500 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-semibold block mb-2">
            Marcas oficiales
          </span>
          <h2 className="tk-theme-text text-xl sm:text-2xl md:text-3xl font-bold font-display tracking-tight">
            Las mejores marcas, al{" "}
            <span className="bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent">
              mejor precio
            </span>
          </h2>
        </motion.div>
      </div>

      {/* Marquee */}
      {reduceMotion ? (
        /* Fallback accesible: grilla estática en 3 cols mobile, 4 tablet, 6 desktop */
        <div className="px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {BRANDS.map((brand) => (
              <BrandCard key={brand.name} brand={brand} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Fade left — más angosto en mobile para no tapar tanto */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full z-10 w-10 sm:w-16 md:w-24"
            style={{ background: "linear-gradient(to right, var(--tk-bg, #020c1e), transparent)" }}
          />
          {/* Fade right */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full z-10 w-10 sm:w-16 md:w-24"
            style={{ background: "linear-gradient(to left, var(--tk-bg, #020c1e), transparent)" }}
          />

          {/* Pista animada — gap y velocidad adaptados */}
          <div
            className="flex gap-3 sm:gap-4 md:gap-6 w-max animate-marquee"
            style={{
              /* Mobile: más rápido porque el viewport es chico y se ve más rápido de lo que es */
              animationDuration: "22s",
            }}
          >
            {TRACK.map((brand, i) => (
              <BrandCard key={`${brand.name}-${i}`} brand={brand} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
