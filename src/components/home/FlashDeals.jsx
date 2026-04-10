import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Zap } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useOffers } from "@/hooks/useOffers";
import { getProductPricing } from "@/utils/offers";
import { createProductSlug } from "@/utils";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight - now) / 1000));
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold font-display text-white tabular-nums">
        {value}
      </div>
      <span className="text-[9px] text-white/50 mt-1 uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
}

export default function FlashDeals() {
  const { products, loading } = useProducts({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();
  const [remaining, setRemaining] = useState(getSecondsUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Productos que tienen oferta activa con descuento porcentual
  const flashProducts = useMemo(() => {
    if (!products.length || !offers.length) return [];
    return products
      .filter((p) => {
        const pricing = getProductPricing(p, offers, 1);
        return pricing.hasOffer && pricing.discountPctApplied >= 5;
      })
      .slice(0, 4);
  }, [products, offers]);

  if (!loading && flashProducts.length === 0) return null;

  const time = formatTime(remaining);

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 bg-[#071530] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-60px] right-[-5%] w-[420px] h-[420px] rounded-full bg-blue-500/15 blur-[140px]" />
        <div className="absolute bottom-[-80px] left-[-8%] w-[350px] h-[350px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -30 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true }}
            transition={reduceMotion ? undefined : { duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-xs tracking-[0.3em] uppercase font-semibold">
                Ofertas del día
              </span>
            </div>
            <h2 className="text-white text-4xl md:text-5xl font-bold font-display tracking-tight">
              Flash{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Deals
              </span>
            </h2>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 30 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true }}
            transition={reduceMotion ? undefined : { duration: 0.6 }}
            className="flex flex-col items-start md:items-end gap-2"
          >
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Terminan hoy a medianoche</span>
            </div>
            <div className="flex items-center gap-2">
              <CountdownUnit value={time.h} label="hs" />
              <span className="text-white/60 text-xl font-bold mb-4">:</span>
              <CountdownUnit value={time.m} label="min" />
              <span className="text-white/60 text-xl font-bold mb-4">:</span>
              <CountdownUnit value={time.s} label="seg" />
            </div>
          </motion.div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div
                  className="aspect-square bg-white/10 rounded-2xl"
                  style={{
                    background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2.5s linear infinite",
                  }}
                />
                <div className="mt-3 h-3 rounded-full bg-white/10 w-2/3" />
                <div className="mt-2 h-4 rounded-full bg-white/10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {flashProducts.map((item, i) => {
              const pricing = getProductPricing(item, offers, 1);
              return (
                <motion.div
                  key={item.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reduceMotion ? undefined : { once: true }}
                  transition={reduceMotion ? undefined : { delay: i * 0.08, duration: 0.55 }}
                >
                  <Link to={`/products/${createProductSlug(item)}`} className="group block">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-yellow-400/30 transition-all duration-300">
                      <img
                        src={item.imagenes?.[0] || "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80"}
                        alt={item.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Discount badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400 text-[#020c1e] text-[10px] font-bold uppercase tracking-[0.15em]">
                          <Zap className="w-2.5 h-2.5 fill-[#020c1e]" />
                          -{pricing.discountPctApplied}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <h3 className="text-white/90 text-sm font-medium leading-tight group-hover:text-yellow-300 transition-colors duration-300 line-clamp-2">
                        {item.nombre}
                      </h3>
                      <div className="flex items-end gap-2">
                        <p className="text-white text-lg font-bold font-display">
                          ${pricing.finalPrice.toLocaleString("es-AR")}
                        </p>
                        <p className="text-white/40 text-xs line-through mb-0.5">
                          ${pricing.basePrice.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={reduceMotion ? undefined : { delay: 0.4 }}
          className="mt-10 text-center"
        >
          <Link
            to="/products?category=offers"
            className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-6 py-3 text-sm text-yellow-300 hover:bg-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300"
          >
            Ver todas las ofertas
            <Zap className="w-4 h-4 fill-yellow-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
