import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { getProductPricing } from "@/utils/offers";

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
  return (
    product.image_url ||
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80"
  );
}

export default function ProductCard({ product, index, offers = [] }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
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

  const previewImage = isHovered && images[1] ? images[1] : images[0];
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
  };

  const handleQtyChange = (value) => {
    const max = hasStockLimit ? Math.max(1, maxStock) : Number.POSITIVE_INFINITY;
    setSelectedQty(clampQty(value, max));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden tk-theme-soft mb-4">
        <img
          src={previewImage}
          alt={name}
          onClick={() => navigate(detailPath)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-[#0A0A0A]/30 flex items-center justify-center gap-3"
        >
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: 0, duration: 0.3 }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 text-[#0A0A0A] shadow-lg"
            onClick={() => navigate(detailPath)}
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            onClick={() => setIsLiked(!isLiked)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isLiked
                ? "bg-red-500 text-white"
                : "bg-white text-[#0A0A0A] hover:bg-red-500 hover:text-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </motion.button>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:bg-green-500 hover:text-white transition-all duration-300 text-[#0A0A0A] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingBag className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {category && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] tracking-[0.15em] uppercase text-[#0A0A0A] font-semibold shadow-sm">
              {category}
            </span>
          </div>
        )}

        {featured && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-[10px] tracking-[0.15em] uppercase text-white font-semibold shadow-lg shadow-blue-500/40">
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
          {brand || category || "Tech"}
        </span>
        <button
          type="button"
          onClick={() => navigate(detailPath)}
          className="text-left tk-theme-text text-base font-semibold leading-tight group-hover:text-blue-600 transition-colors duration-300"
        >
          {name}
        </button>

        {pricing.hasOffer ? (
          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <p className="tk-theme-text text-xl font-bold">${pricing.finalPrice.toFixed(2)}</p>
              <p className="text-sm tk-theme-muted line-through">
                ${pricing.basePrice.toFixed(2)}
              </p>
            </div>
            <p className="text-[11px] text-emerald-600">
              Ahorras ${pricing.savingsPerUnit.toFixed(2)} por unidad
            </p>
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
              className="flex-1 rounded-xl bg-blue-600 text-white text-xs uppercase tracking-[0.2em] py-2 font-semibold hover:bg-blue-700 transition disabled:bg-black/20 disabled:text-white/60 disabled:cursor-not-allowed"
            >
              {outOfStock ? "Sin stock" : "Agregar"}
            </button>
          </div>

          {hasStockLimit && <p className="text-[11px] tk-theme-muted">Stock disponible: {maxStock}</p>}
          {pricing.volumeHintMinUnits && !pricing.hasOffer && (
            <p className="text-[11px] text-blue-600">
              Oferta por volumen desde {pricing.volumeHintMinUnits} unidades.
            </p>
          )}
          {pricing.hasOffer && pricing.offerTitle && (
            <p className="text-[11px] text-orange-600 uppercase tracking-[0.14em]">
              {pricing.offerTitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
