import React, { useEffect, useMemo, useState } from "react";
import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { getProductPricing } from "@/utils/offers";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";
import { createProductSlug } from "@/utils";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/utils/cloudinary";

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
    <div className="product-card group flex h-full flex-col">
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-lg tk-theme-soft">
        <img
          src={getCloudinaryUrl(previewImage, { width: 600, format: "auto", quality: "auto" })}
          srcSet={getCloudinarySrcSet(previewImage, [300, 600, 900])}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={name}
          onClick={() => navigate(detailPath)}
          className="h-full w-full cursor-pointer object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width="600"
          height="800"
        />

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-70" />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/92 text-[#0A0A0A] transition hover:bg-blue-600 hover:text-white"
            onClick={() => navigate(detailPath)}
            aria-label="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleLike}
            className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg transition ${
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
          <div className="absolute top-4 right-4">
            <span className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-500/30">
              Destacado
            </span>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-4">
            <span className="rounded-md bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-white">
              {images.length} fotos
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 px-0.5">
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
              <p className="text-xl font-bold tk-theme-text">${pricing.finalPrice.toFixed(2)}</p>
              <p className="text-sm tk-theme-muted line-through">${pricing.basePrice.toFixed(2)}</p>
            </div>
            <p className="text-[11px] text-emerald-600">Ahorras ${pricing.savingsPerUnit.toFixed(2)} por unidad</p>
          </div>
        ) : (
          <p className="text-xl font-bold tk-theme-text">${pricing.basePrice.toFixed(2)}</p>
        )}

        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border tk-theme-border tk-theme-surface">
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
              className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-white/60 ${
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
    </div>
  );
}
