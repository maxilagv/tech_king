import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Footer from "@/components/common/Footer";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
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

export default function ProductDetail() {
  const { productId } = useParams();
  const { products, loading } = useProducts({ onlyActive: true });
  const { categories } = useCategories({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });
  const { addItem } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);

  const product = useMemo(
    () => products.find((item) => String(item.id) === String(productId)) || null,
    [products, productId]
  );

  useEffect(() => {
    setSelectedImageIndex(0);
    setQty(1);
    setZoomOpen(false);
  }, [productId]);

  const images = useMemo(() => {
    if (!product) return [];
    const source = Array.isArray(product.imagenes) && product.imagenes.length > 0
      ? product.imagenes
      : [product.image_url || ""].filter(Boolean);
    return source.length > 0
      ? source
      : ["https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1200&q=80"];
  }, [product]);

  useEffect(() => {
    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [images, selectedImageIndex]);

  useEffect(() => {
    if (!zoomOpen) return undefined;
    const onEsc = (event) => {
      if (event.key === "Escape") {
        setZoomOpen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [zoomOpen]);

  if (!loading && !product) {
    return (
      <div className="min-h-screen tk-theme-bg pt-28 pb-20 px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto rounded-3xl tk-theme-card p-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Producto</p>
          <h1 className="text-3xl font-semibold mt-3 tk-theme-text">No encontrado</h1>
          <p className="text-sm tk-theme-muted mt-3">
            El producto que intentaste abrir no existe o no esta activo.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-6 rounded-full bg-blue-600 px-5 py-3 text-xs tracking-[0.2em] uppercase text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catalogo
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen tk-theme-bg pt-28 pb-20 flex items-center justify-center">
        <div className="text-sm tk-theme-muted">Cargando producto...</div>
      </div>
    );
  }

  const maxStock = parseStock(product.stockActual);
  const hasStockLimit = Number.isFinite(maxStock);
  const outOfStock = hasStockLimit && maxStock <= 0;
  const pricing = getProductPricing(product, offers, qty);
  const categoryMap = Object.fromEntries(categories.map((cat) => [cat.slug || cat.id, cat.nombre]));
  const categoryLabel = categoryMap[product.categorySlug] || product.categorySlug || "Sin categoria";

  const handleQtyChange = (value) => {
    const max = hasStockLimit ? Math.max(1, maxStock) : Number.POSITIVE_INFINITY;
    setQty(clampQty(value, max));
  };

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
      qty
    );
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="tk-theme-bg tk-theme-text min-h-screen">
      <section className="pt-28 pb-28 md:pb-14 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase tk-theme-muted hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catalogo
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden border tk-theme-border tk-theme-soft">
                <img
                  src={images[selectedImageIndex]}
                  alt={product.nombre}
                  className="w-full h-[420px] md:h-[560px] object-cover cursor-zoom-in"
                  onClick={() => setZoomOpen(true)}
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--tk-surface-elevated)] border tk-theme-border flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--tk-surface-elevated)] border tk-theme-border flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`rounded-xl overflow-hidden border ${
                        selectedImageIndex === index ? "border-blue-600" : "tk-theme-border"
                      }`}
                    >
                      <img src={img} alt={`${product.nombre}-${index + 1}`} className="w-full h-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border tk-theme-border tk-theme-surface p-6 md:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[var(--tk-field-bg)] text-[10px] tracking-[0.2em] uppercase tk-theme-muted">
                  {categoryLabel}
                </span>
                {pricing.hasOffer && (
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-[10px] tracking-[0.2em] uppercase text-white">
                    Oferta activa
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold tk-theme-text">{product.nombre}</h1>
                {product.marca && (
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-600 mt-2">{product.marca}</p>
                )}
              </div>

              {pricing.hasOffer ? (
                <div className="space-y-1">
                  <div className="flex items-end gap-3">
                    <p className="text-4xl font-bold tk-theme-text">${pricing.finalPrice.toFixed(2)}</p>
                    <p className="text-lg tk-theme-muted line-through">${pricing.basePrice.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-emerald-600">
                    Ahorras ${pricing.savingsPerUnit.toFixed(2)} por unidad
                  </p>
                </div>
              ) : (
                <p className="text-4xl font-bold tk-theme-text">${pricing.basePrice.toFixed(2)}</p>
              )}

              <p className="text-sm tk-theme-muted leading-relaxed">
                {product.descripcion || "Producto disponible en Tech King con garantia oficial y soporte."}
              </p>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-xl border tk-theme-border tk-theme-surface">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(qty - 1)}
                      disabled={qty <= 1 || outOfStock}
                      className="w-10 h-10 tk-theme-muted hover:bg-[var(--tk-field-bg)] disabled:opacity-40"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(event) => handleQtyChange(event.target.value)}
                      disabled={outOfStock}
                      className="w-14 h-10 text-center text-sm bg-white text-[#0A0A0A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(qty + 1)}
                      disabled={outOfStock || (hasStockLimit && qty >= maxStock)}
                      className="w-10 h-10 tk-theme-muted hover:bg-[var(--tk-field-bg)] disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    className="hidden md:flex flex-1 items-center justify-center rounded-2xl bg-blue-600 text-white py-3 text-sm font-semibold uppercase tracking-[0.2em] hover:bg-blue-700 transition disabled:bg-black/20 disabled:text-white/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      {outOfStock ? "Sin stock" : "Agregar al carrito"}
                    </span>
                  </button>
                </div>

                {hasStockLimit && <p className="text-xs tk-theme-muted">Stock disponible: {maxStock}</p>}
                {pricing.volumeHintMinUnits && (
                  <p className="text-xs text-blue-600">
                    Esta oferta mejora desde {pricing.volumeHintMinUnits} unidades.
                  </p>
                )}
                {pricing.hasOffer && pricing.offerTitle && (
                  <p className="text-xs text-orange-600 uppercase tracking-[0.2em]">{pricing.offerTitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {zoomOpen && (
        <div className="fixed inset-0 z-[80] bg-black/85 p-6 md:p-10" onClick={() => setZoomOpen(false)}>
          <div className="h-full w-full flex items-center justify-center">
            <img
              src={images[selectedImageIndex]}
              alt={`${product.nombre}-zoom`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[75] border-t tk-theme-border bg-[var(--tk-surface-elevated)] backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="min-w-0">
            {pricing.hasOffer ? (
              <div>
                <p className="text-lg font-bold tk-theme-text">${pricing.finalPrice.toFixed(2)}</p>
                <p className="text-xs tk-theme-muted line-through">${pricing.basePrice.toFixed(2)}</p>
              </div>
            ) : (
              <p className="text-lg font-bold tk-theme-text">${pricing.basePrice.toFixed(2)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 rounded-xl bg-blue-600 text-white py-3 text-xs font-semibold uppercase tracking-[0.2em] disabled:bg-black/20 disabled:text-white/60"
          >
            {outOfStock ? "Sin stock" : `Agregar x${qty}`}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
