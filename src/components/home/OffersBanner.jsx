import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";

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

  const productImageMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.imagenes?.[0] || ""])),
    [products]
  );

  const visibleOffers = useMemo(() => offers.slice(0, 3), [offers]);

  if (loading || visibleOffers.length === 0) return null;

  return (
    <section className="px-6 md:px-16 lg:px-24 py-10 tk-theme-bg">
      <div className="max-w-7xl mx-auto space-y-5">
        <Link
          to="/products?category=offers"
          className="group flex items-center justify-between rounded-3xl border px-6 py-5"
          style={{
            borderColor: "var(--tk-offer-border)",
            background: "var(--tk-offer-surface)",
          }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-orange-500">Ofertas activas</p>
            <h2 className="text-2xl md:text-3xl font-bold tk-theme-text mt-2">
              Promociones en tiempo real
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-orange-700 text-xs tracking-[0.2em] uppercase">
            <Sparkles className="w-4 h-4" />
            Ver ofertas
          </div>
        </Link>

        <div className="grid gap-4 md:grid-cols-3">
          {visibleOffers.map((offer) => {
            const banner =
              offer.bannerImages?.[0] ||
              productImageMap.get((offer.productIds || [])[0]) ||
              "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&q=80";

            return (
              <Link
                key={offer.id}
                to="/products?category=offers"
                className="group relative block rounded-3xl overflow-hidden min-h-44 border tk-theme-border"
              >
                <img
                  src={banner}
                  alt={offer.titulo}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
                <div className="relative z-10 p-5 h-full flex flex-col justify-end">
                  <span className="inline-flex w-fit mb-3 px-3 py-1 rounded-full bg-white/90 text-[10px] tracking-[0.2em] uppercase text-[#0A0A0A] font-semibold">
                    {getOfferBadge(offer)}
                  </span>
                  <p className="text-white text-lg font-semibold leading-tight">{offer.titulo}</p>
                  <p className="text-white/75 text-xs mt-1">{offer.descripcion || "Oferta especial"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
