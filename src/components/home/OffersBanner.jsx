import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

function getOfferBadge(offer) {
  if (offer.descuentoPct !== undefined && offer.descuentoPct !== null) {
    return `-${Number(offer.descuentoPct)}%`;
  }
  if (offer.tipo === "volumen") {
    return `x${Math.max(1, Number(offer.minUnidades || 1))}+`;
  }
  return "Promo";
}

export default function OffersBanner() {
  const { offers, loading } = useOffers({ onlyActive: true });
  const { products } = useProducts({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();

  const productImageMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.imagenes?.[0] || ""])),
    [products]
  );

  const visibleOffers = useMemo(() => offers.slice(0, 3), [offers]);

  // Reservar espacio para evitar CLS — la sección ocupa ~170px cuando aparece.
  // Retornar null haría que todo el contenido debajo suba y luego baje.
  if (loading) {
    return (
      <section
        aria-hidden="true"
        style={{ minHeight: "170px", contain: "layout" }}
        className="py-10 tk-theme-bg"
      />
    );
  }

  if (visibleOffers.length === 0) return null;


  return (
    <section id="home-offers" className="tk-landing-band py-12 md:py-16 tk-theme-bg">
      <div className="tk-section-shell space-y-5 md:space-y-6">
        <Link
          to="/products?category=offers"
          className="group grid gap-5 rounded-lg border px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:grid-cols-[1fr_auto] md:items-center md:px-7 md:py-6"
          style={{
            borderColor: "var(--tk-offer-border)",
            background: "var(--tk-offer-surface)",
          }}
        >
          <div>
            <p className="tk-kicker">Ofertas activas</p>
            <h2 className="tk-heading mt-2 text-2xl md:text-4xl">
              Promociones en tiempo real
            </h2>
          </div>
          <div className="tk-pressable inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white">
            <Sparkles className="w-4 h-4" />
            Ver ofertas
          </div>
        </Link>

        <div className="grid gap-4 md:grid-cols-3">
          {visibleOffers.map((offer, index) => {
            const banner =
              offer.bannerImages?.[0] ||
              productImageMap.get((offer.productIds || [])[0]) ||
              "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&q=80";

            return (
              <motion.div
                key={offer.id}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reduceMotion ? undefined : { once: true, amount: 0.3 }}
                transition={reduceMotion ? undefined : { delay: index * 0.08, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to="/products?category=offers"
                  className="tk-image-lift group relative block min-h-44 overflow-hidden rounded-lg border border-white/10 bg-[#07111f] md:min-h-56"
                >
                  <img
                    src={banner}
                    alt={offer.titulo}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,12,30,0.92),rgba(2,12,30,0.34)_58%,rgba(2,12,30,0.06))]" />
                  <div className="relative z-10 flex min-h-44 flex-col justify-end p-5 md:min-h-56 md:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="inline-flex w-fit rounded-md bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#07111f]">
                        {getOfferBadge(offer)}
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-lg font-bold leading-tight text-white md:text-xl">{offer.titulo}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/72 md:text-sm">{offer.descripcion || "Oferta especial"}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
