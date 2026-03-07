import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { getProductPricing } from "@/utils/offers";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";

const LIKED_KEY = "tk-liked-products";

function parseStock(rawStock) {
  const parsed = Number(rawStock);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor(parsed));
}

function clampQty(value, maxStock) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  const qty = Math.max(1, Math.floor(parsed));
  return Math.min(qty, maxStock);
}

function buildFallbackImage(product) {
  return product.image_url || "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80";
}

export default function ProductCard({ product, index, offers = [] }) {
  const navigate = useNavigate();
  const reduceMotion = useShouldReduceMotion();
  const { isDark } = useTheme();
  const [isLiked, setIsLiked] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LIKED_KEY) || "[]");
      return stored.includes(String(product.id));
    } catch { return false; }
  });
  const [selectedQty, setSelectedQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();

  const name = product.nombre ?? product.name;
  const category = product.categoryLabel ?? product.categorySlug ?? product.category;
  const featured = product.destacado ?? product.featured;
  const brand = product.marca ?? product.brand;
  const detailPath = `/products/${product.id}`;

  const images = useMemo(() => {
    const list = Array.isArray(product.imagenes) ? product.imagenes.filter(Boolean) : [];
    if (list.length > 0) return list;
    return [buildFallbackImage(product)];
  }, [product]);

  const previewImage = images[0];
  const maxStock = parseStock(product.stockActual);
  const hasStockLimit = Number.isFinite(maxStock);
  const outOfStock = hasStockLimit && maxStock <= 0;
  const cannotIncrease = hasStockLimit && selectedQty >= maxStock;
  const pricing = useMemo(
    () => getProductPricing(product, offers, selectedQty),
    [product, offers, selectedQty]
  );

  useEffect(() => {
    if (hasStockLimit) {
      setSelectedQty((prev) => Math.min(Math.max(1, prev), Math.max(1, maxStock)));
    }
  }, [hasStockLimit, maxStock]);

  const handleAddToCart = () => {
    if (outOfStock) return;

    addItem(
      {
        ...product,
        imagen: previewImage,
        precio: pricing.finalPrice,
        precioOriginal: pricing.basePrice,
        ofertaAplicada: pricing.offer
          ? {
              id: pricing.offer.id,
              titulo: pricing.offerTitle,
              tipo: pricing.offerType,
              descuentoPct: pricing.offer?.descuentoPct ?? null,
              precioOferta: pricing.offer?.precioOferta ?? null,
              minUnidades: pricing.offer?.minUnidades ?? null,
              startsAt: pricing.offer?.startsAt ?? null,
              endsAt: pricing.offer?.endsAt ?? null,
            }
          : null,
      },
      selectedQty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const toggleLike = () => {
    setIsLiked((prev) => {
      try {
        const stored = JSON.parse(localStorage.getItem(LIKED_KEY) || "[]");
        const next = prev
          ? stored.filter((id) => id !== String(product.id))
          : [...stored, String(product.id)];
        localStorage.setItem(LIKED_KEY, JSON.stringify(next));
      } catch {}
      return !prev;
    });
  };

  const handleQtyChange = (value) => {
    const max = hasStockLimit ? Math.max(1, maxStock) : Number.POSITIVE_INFINITY;
    setSelectedQty(clampQty(value, max));
  };

  const cardAnimationProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "0px 0px -20px 0px" },
        transition: { delay: Math.min(index, 6) * 0.04, duration: 0.35 },
      };

  return (
    <motion.div className="group" {...cardAnimationProps}>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden tk-theme-soft mb-4">
        <img
          src={previewImage}
          alt={name}
          onClick={() => navigate(detailPath)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out cursor-pointer"
          loading="lazy"
        />

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-70" />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <button
            type="button"
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/90 text-[#0A0A0A] flex items-center justify-center hover:bg-blue-600 hover:text-white transition"
            onClick={() => navigate(detailPath)}
            aria-label="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleLike}
            className={`pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center transition ${
              isLiked ? "bg-rose-500 text-white" : "bg-white/90 text-[#0A0A0A] hover:bg-rose-500 hover:text-white"
            }`}
            aria-label="Favorito"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>

        {category && (
          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1.5 rounded-full backdrop-blur-sm text-[10px] tracking-[0.15em] uppercase font-semibold shadow-sm ${
                isDark
                  ? "bg-black/65 text-white border border-white/20"
                  : "bg-white/95 text-[#0A0A0A]"
              }`}
            >
              {category}
            </span>
          </div>
        )}

        {featured && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-[10px] tracking-[0.15em] uppercase text-white font-semibold shadow-lg shadow-blue-500/40">
              Destacado
            </span>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-4">
            <span className="px-2.5 py-1 rounded-full bg-black/55 text-[10px] tracking-[0.15em] uppercase text-white">
              {images.length} fotos
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 px-1">
        <span className="text-blue-600 text-[10px] tracking-[0.2em] uppercase block font-semibold">
          {brand || category || "Electronica"}
        </span>
        <button
          type="button"
          onClick={() => navigate(detailPath)}
          className="text-left tk-theme-text text-base font-semibold leading-tight hover:text-blue-600 transition-colors duration-300"
        >
          {name}
        </button>

        {pricing.hasOffer ? (
          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <p className="tk-theme-text text-xl font-bold">${pricing.finalPrice.toFixed(2)}</p>
              <p className="text-sm tk-theme-muted line-through">${pricing.basePrice.toFixed(2)}</p>
            </div>
            <p className="text-[11px] text-emerald-600">Ahorras ${pricing.savingsPerUnit.toFixed(2)} por unidad</p>
          </div>
        ) : (
          <p className="tk-theme-text text-xl font-bold">${pricing.basePrice.toFixed(2)}</p>
        )}

        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-xl border tk-theme-border tk-theme-surface">
              <button
                type="button"
                onClick={() => handleQtyChange(selectedQty - 1)}
                disabled={selectedQty <= 1 || outOfStock}
                className="w-8 h-8 text-sm tk-theme-muted hover:bg-[var(--tk-field-bg)] disabled:opacity-40"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={selectedQty}
                onChange={(event) => handleQtyChange(event.target.value)}
                className="w-10 h-8 text-center text-sm outline-none bg-transparent tk-theme-text"
                disabled={outOfStock}
              />
              <button
                type="button"
                onClick={() => handleQtyChange(selectedQty + 1)}
                disabled={cannotIncrease || outOfStock}
                className="w-8 h-8 text-sm tk-theme-muted hover:bg-[var(--tk-field-bg)] disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex-1 rounded-xl text-white text-xs uppercase tracking-[0.2em] py-2 font-semibold transition disabled:bg-black/20 disabled:text-white/60 disabled:cursor-not-allowed ${
                justAdded ? "bg-emerald-600 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {justAdded ? (
                  <><Check className="w-3.5 h-3.5" /> Agregado</>
                ) : outOfStock ? (
                  "Sin stock"
                ) : (
                  <><ShoppingBag className="w-3.5 h-3.5" /> Agregar</>
                )}
              </span>
            </button>
          </div>

          {hasStockLimit && <p className="text-[11px] tk-theme-muted">Stock disponible: {maxStock}</p>}
          {pricing.volumeHintMinUnits && !pricing.hasOffer && (
            <p className="text-[11px] text-blue-600">
              Oferta por volumen desde {pricing.volumeHintMinUnits} unidades.
            </p>
          )}
          {pricing.hasOffer && pricing.offerTitle && (
            <p className="text-[11px] text-orange-600 uppercase tracking-[0.14em]">{pricing.offerTitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
