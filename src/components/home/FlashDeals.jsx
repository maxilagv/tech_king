import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Zap } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useOffers } from "@/hooks/useOffers";
import { getProductPricing } from "@/utils/offers";
import { createProductSlug } from "@/utils";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { getCloudinaryUrl } from "@/utils/cloudinary";

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
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/18 bg-white/10 font-display text-lg font-bold tabular-nums text-white md:h-12 md:w-12 md:text-xl">
        {value}
      </div>
      <span className="mt-1 text-[9px] uppercase tracking-[0.15em] text-white/50">{label}</span>
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

  const flashProducts = useMemo(() => {
    if (!products.length || !offers.length) return [];
    return products
      .filter((product) => {
        const pricing = getProductPricing(product, offers, 1);
        return pricing.hasOffer && pricing.discountPctApplied >= 5;
      })
      .slice(0, 4);
  }, [products, offers]);

  if (loading) {
    return (
      <section
        aria-hidden="true"
        style={{ minHeight: "400px", contain: "layout" }}
        className="bg-[#071530] py-20 md:py-28"
      />
    );
  }

  if (!loading && flashProducts.length === 0) return null;

  const time = formatTime(remaining);

  return (
    <section className="tk-landing-band relative overflow-hidden bg-[#071530] py-20 md:py-28">
      <div className="tk-section-shell relative z-10">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
            transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-yellow-400">
                Ofertas del dia
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold tracking-[0] text-white md:text-6xl">
              Flash{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Deals
              </span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/62 md:text-base">
              Descuentos activos hasta medianoche en productos seleccionados.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
            transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start gap-2 md:items-end"
          >
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Clock className="h-3.5 w-3.5" />
              <span>Terminan hoy a medianoche</span>
            </div>
            <div className="flex items-center gap-2">
              <CountdownUnit value={time.h} label="hs" />
              <span className="mb-4 text-xl font-bold text-white/60">:</span>
              <CountdownUnit value={time.m} label="min" />
              <span className="mb-4 text-xl font-bold text-white/60">:</span>
              <CountdownUnit value={time.s} label="seg" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {flashProducts.map((item, index) => {
            const pricing = getProductPricing(item, offers, 1);
            return (
              <motion.div
                key={item.id}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reduceMotion ? undefined : { once: true, amount: 0.25 }}
                transition={reduceMotion ? undefined : { delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to={`/products/${createProductSlug(item)}`} className="group block">
                  <div className="tk-image-lift relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-yellow-400/35">
                    <img
                      src={getCloudinaryUrl(
                        item.imagenes?.[0] || "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80",
                        { width: 400, format: "auto", quality: "auto" }
                      )}
                      alt={item.nombre}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="400"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-yellow-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#020c1e]">
                        <Zap className="h-2.5 w-2.5 fill-[#020c1e]" />
                        -{pricing.discountPctApplied}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white/90 transition-colors duration-300 group-hover:text-yellow-300">
                      {item.nombre}
                    </h3>
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                      <p className="font-display text-lg font-bold text-white">
                        ${pricing.finalPrice.toLocaleString("es-AR")}
                      </p>
                      <p className="mb-0.5 text-xs text-white/40 line-through">
                        ${pricing.basePrice.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={reduceMotion ? undefined : { delay: 0.4, duration: 0.45 }}
          className="mt-10 text-center"
        >
          <Link
            to="/products?category=offers"
            className="tk-pressable inline-flex min-h-12 items-center gap-2 rounded-lg border border-yellow-400/45 bg-yellow-400/10 px-6 py-3 text-sm font-bold text-yellow-300 transition-all duration-300 hover:border-yellow-400/70 hover:bg-yellow-400/18"
          >
            Ver todas las ofertas
            <Zap className="h-4 w-4 fill-yellow-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
