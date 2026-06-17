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

const TRACK = [...BRANDS, ...BRANDS, ...BRANDS];

function BrandCard({ brand }) {
  return (
    <div className="group flex h-12 min-w-[104px] select-none items-center justify-center rounded-lg border tk-theme-border bg-[var(--tk-surface)] px-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/45 sm:h-14 sm:min-w-[132px] md:min-w-[154px] md:px-6">
      <span
        className="whitespace-nowrap text-sm font-extrabold tracking-[0] opacity-60 transition-opacity duration-300 group-hover:opacity-100 sm:text-base md:text-lg"
        style={{ color: brand.color, filter: "saturate(0.72)" }}
      >
        {brand.name}
      </span>
    </div>
  );
}

export default function BrandsSection() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="overflow-hidden border-y tk-theme-border py-12 md:py-16 tk-theme-bg">
      <div className="tk-section-shell mb-8 md:mb-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.4 }}
          transition={reduceMotion ? undefined : { duration: 0.45 }}
          className="text-center"
        >
          <span className="tk-kicker mb-2 block">Marcas oficiales</span>
          <h2 className="tk-heading text-2xl md:text-3xl">
            Las mejores marcas, al <span className="text-blue-600">mejor precio</span>
          </h2>
        </motion.div>
      </div>

      {reduceMotion ? (
        <div className="tk-section-shell grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {BRANDS.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 sm:w-16 md:w-24"
            style={{ background: "linear-gradient(to right, var(--tk-bg), transparent)" }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 sm:w-16 md:w-24"
            style={{ background: "linear-gradient(to left, var(--tk-bg), transparent)" }}
          />
          <div className="flex w-max gap-3 animate-marquee sm:gap-4 md:gap-5" style={{ animationDuration: "24s" }}>
            {TRACK.map((brand, index) => (
              <BrandCard key={`${brand.name}-${index}`} brand={brand} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
