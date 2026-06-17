import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { getProductPricing } from "@/utils/offers";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useSpotlight } from "@/hooks/useSpotlight";
import { useTheme } from "@/context/ThemeContext";
import { createProductSlug } from "@/utils";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/utils/cloudinary";
import { flyToCart } from "@/utils/flyToCart";

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
  const spotlight = useSpotlight();
  const imageRef = useRef(null);
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
  const detailPath = `/products/${createProductSlug(product)}`;

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
    flyToCart(imageRef.current, { reduceMotion });
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

  return (
    <div className="product-card group h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border tk-theme-border bg-[var(--tk-surface)] p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-blue-400/55 hover:shadow-[0_30px_60px_-28px_rgba(15,23,42,0.42)]">
      <div
        ref={spotlight.ref}
        onMouseMove={spotlight.onMouseMove}
        className="tk-spotlight relative aspect-[4/5] overflow-hidden rounded-xl tk-theme-soft"
      >
        <img
          ref={imageRef}
          src={getCloudinaryUrl(previewImage, { width: 600, format: "auto", quality: "auto" })}
          srcSet={getCloudinarySrcSet(previewImage, [300, 600, 900])}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={name}
          onClick={() => navigate(detailPath)}
          className="h-full w-full cursor-pointer object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.07]"
          loading="lazy"
          decoding="async"
          width="600"
          height="800"
        />

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 opacity-0 translate-y-1.5 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
          <button
            type="button"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/92 text-[#0A0A0A] shadow-lg shadow-black/20 transition hover:bg-blue-600 hover:text-white hover:scale-110"
            onClick={() => navigate(detailPath)}
            aria-label="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleLike}
            className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg shadow-lg shadow-black/20 transition hover:scale-110 ${
              isLiked ? "bg-rose-500 text-white" : "bg-white/90 text-[#0A0A0A] hover:bg-rose-500 hover:text-white"
            }`}
            aria-label="Favorito"
          >
            <Heart className={`w-4 h-4 transition-transform ${isLiked ? "fill-current scale-110" : ""}`} />
          </button>
        </div>

        {category && (
          <div className="absolute top-4 left-4 z-10">
            <span
              className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] shadow-sm backdrop-blur-sm ${
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
          <div className="absolute top-4 right-4 z-10">
            <span className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-500/30">
              Destacado
            </span>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 z-10 transition-opacity duration-300 group-hover:opacity-0">
            <span className="rounded-md bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-white">
              {images.length} fotos
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col space-y-1.5 px-1.5 pb-1 pt-3.5">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          {brand || category || "Electronica"}
        </span>
        <button
          type="button"
          onClick={() => navigate(detailPath)}
          className="min-h-[2.5rem] text-left text-base font-semibold leading-tight tk-theme-text transition-colors duration-300 hover:text-blue-600"
        >
          {name}
        </button>

        {pricing.hasOffer ? (
          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <p className="origin-left text-xl font-bold tk-theme-text transition-transform duration-300 group-hover:scale-105">${pricing.finalPrice.toFixed(2)}</p>
              <p className="text-sm tk-theme-muted line-through">${pricing.basePrice.toFixed(2)}</p>
            </div>
            <p className="text-[11px] text-emerald-600">Ahorras ${pricing.savingsPerUnit.toFixed(2)} por unidad</p>
          </div>
        ) : (
          <p className="origin-left text-xl font-bold tk-theme-text transition-transform duration-300 group-hover:scale-105">${pricing.basePrice.toFixed(2)}</p>
        )}

        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-xl border tk-theme-border bg-[var(--tk-field-bg)]">
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
              className={`tk-shine flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-white/60 ${
                justAdded ? "bg-emerald-600 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25"
              }`}
            >
              <span className="relative z-[2] inline-flex items-center gap-1.5">
                {justAdded ? (
                  <><Check className="w-3.5 h-3.5 animate-tk-check-pop" /> Agregado</>
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
      </div>
    </div>
  );
}
