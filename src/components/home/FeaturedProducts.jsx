import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl, createProductSlug } from "@/utils";
import { ArrowUpRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { getProductPricing } from "@/utils/offers";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useSpotlight } from "@/hooks/useSpotlight";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/utils/cloudinary";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FeaturedProducts() {
  const { products, loading } = useProducts({ onlyActive: true, featuredOnly: true, limit: 4 });
  const { categories } = useCategories({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();
  const spotlight = useSpotlight();

  const sectionRef = useRef(null);

  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.slug || cat.id, cat.nombre])
  );

  const getCategoryLabel = (item) =>
    categoryMap[item.categorySlug] || item.categorySlug || "Electronica";

  const getProductImage = (item) =>
    item.imagenes?.[0] ||
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=900&q=80";

  useGSAP(() => {
    if (reduceMotion) return;

    const headerElems = gsap.utils.toArray(".header-elem", sectionRef.current);
    if (!headerElems.length) return;

    gsap.set(headerElems, { opacity: 0, y: 30 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 82%",
        toggleActions: "play none none none",
        fastScrollEnd: true,
      }
    });

    tl.to(headerElems, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: "transform",
    });
  }, { scope: sectionRef, dependencies: [reduceMotion] });

  useGSAP(() => {
    if (reduceMotion || products.length === 0) return;

    const cards = gsap.utils.toArray(".product-card", sectionRef.current);
    if (!cards.length) return;

    const grid = sectionRef.current?.querySelector(".products-grid");
    if (!grid) return;

    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.09,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: grid,
            start: "top 87%",
            toggleActions: "play none none none",
            fastScrollEnd: true,
          }
        }
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: grid,
            start: "top 90%",
            toggleActions: "play none none none",
            fastScrollEnd: true,
          }
        }
      );
    });

    return () => mm.revert();
  }, { scope: sectionRef, dependencies: [products, reduceMotion] });

  return (
    <section ref={sectionRef} className="tk-landing-band py-20 md:py-28 tk-theme-soft">
      <div className="tk-section-shell">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="header-elem tk-kicker mb-4 block">
              Lo mas elegido
            </span>
            <h2 className="header-elem tk-heading text-4xl md:text-5xl lg:text-6xl">
              Productos
              <br />
              <span className="text-blue-600">
                destacados
              </span>
            </h2>
            <p className="header-elem mt-4 max-w-xl text-sm leading-relaxed tk-theme-muted md:text-base">
              Accesorios y tecnologia seleccionados por rotacion, precio y disponibilidad.
            </p>
          </div>
          <div className="header-elem">
            <Link
              to={createPageUrl("Products")}
              className="tk-pressable inline-flex min-h-11 items-center rounded-lg border tk-theme-border px-4 text-xs font-bold uppercase tracking-[0.16em] tk-theme-text transition-colors hover:border-blue-500 hover:text-blue-600 md:mt-0"
            >
              Ver catalogo -&gt;
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="products-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="products-grid py-16 text-center text-sm tk-theme-muted">
            No hay productos destacados.
          </div>
        ) : (
          <div className="products-grid grid grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-2">
            {products.map((item, index) => {
              const pricing = getProductPricing(item, offers, 1);
              const productImage = getProductImage(item);
              const isSpotlight = index === 0;

              if (isSpotlight) {
                return (
                  <div key={item.id} className="product-card lg:col-span-2 lg:row-span-2">
                    <Link
                      ref={spotlight.ref}
                      onMouseMove={spotlight.onMouseMove}
                      to={`/products/${createProductSlug(item)}`}
                      className="tk-spotlight group relative block h-full min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[#07111f] md:min-h-[620px] lg:min-h-full"
                    >
                      <img
                        src={getCloudinaryUrl(productImage, { width: 900, format: "auto", quality: "auto" })}
                        srcSet={
                          item.imagenes?.[0]
                            ? getCloudinarySrcSet(productImage, [480, 720, 900, 1200])
                            : undefined
                        }
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        alt={item.nombre}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
                        loading="lazy"
                        decoding="async"
                        width="900"
                        height="1200"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,12,30,0.94),rgba(2,12,30,0.48)_44%,rgba(2,12,30,0.12))]" />
                      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 md:p-6">
                        <span className="rounded-md border border-white/15 bg-white/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                          Seleccion destacada
                        </span>
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/18 bg-white/12 text-white opacity-80 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-[#07111f]">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-7">
                        <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">
                          {getCategoryLabel(item)}
                        </span>
                        <h3 className="max-w-xl font-display text-3xl font-bold leading-[1.02] tracking-[0] text-white md:text-5xl">
                          {item.nombre}
                        </h3>
                        <div className="mt-5 flex flex-col gap-4 border-t border-white/14 pt-5 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            {pricing.hasOffer ? (
                              <div className="flex flex-wrap items-end gap-2">
                                <p className="font-display text-3xl font-bold text-white">
                                  {formatCurrency(pricing.finalPrice)}
                                </p>
                                <p className="pb-1 text-sm text-white/48 line-through">
                                  {formatCurrency(pricing.basePrice)}
                                </p>
                              </div>
                            ) : (
                              <p className="font-display text-3xl font-bold text-white">
                                {formatCurrency(item.precio)}
                              </p>
                            )}
                            {pricing.hasOffer && (
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                                -{pricing.discountPctApplied}% activo
                              </p>
                            )}
                          </div>
                          <span className="inline-flex min-h-11 w-fit items-center rounded-lg bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#07111f] transition-colors group-hover:bg-blue-50">
                            Ver producto
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              }

              return (
                <div key={item.id} className={`product-card ${index === 3 ? "lg:col-span-2" : ""}`}>
                  <Link
                    to={`/products/${createProductSlug(item)}`}
                    className={`group grid h-full min-h-[180px] grid-cols-[42%_1fr] overflow-hidden rounded-lg border tk-theme-border bg-[var(--tk-surface)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-400/55 hover:shadow-[0_24px_70px_rgba(15,23,42,0.13)] sm:min-h-[220px] lg:min-h-0 ${
                      index === 3 ? "lg:grid-cols-[42%_1fr]" : "lg:grid-cols-1"
                    }`}
                  >
                    <div className={`relative min-h-full overflow-hidden bg-[var(--tk-soft)] ${index === 3 ? "" : "lg:aspect-[4/3]"}`}>
                      <img
                        src={getCloudinaryUrl(productImage, { width: 600, format: "auto", quality: "auto" })}
                        srcSet={
                          item.imagenes?.[0]
                            ? getCloudinarySrcSet(productImage, [300, 600, 900])
                            : undefined
                        }
                        sizes="(max-width: 1024px) 42vw, 25vw"
                        alt={item.nombre}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        width="600"
                        height="800"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020c1e]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      {pricing.hasOffer && (
                        <div className="absolute left-3 top-3">
                          <span className="rounded-md bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg">
                            -{pricing.discountPctApplied}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between p-4 md:p-5">
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                            {getCategoryLabel(item)}
                          </span>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border tk-theme-border text-[var(--tk-text)] opacity-60 transition-all duration-300 group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white group-hover:opacity-100">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <h3 className="line-clamp-2 text-base font-bold leading-tight tk-theme-text transition-colors duration-300 group-hover:text-blue-600 md:text-lg">
                          {item.nombre}
                        </h3>
                      </div>

                      <div className="mt-5 border-t tk-theme-border pt-4">
                        {pricing.hasOffer ? (
                          <div>
                            <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                              <p className="font-display text-xl font-bold tk-theme-text">
                                {formatCurrency(pricing.finalPrice)}
                              </p>
                              <p className="pb-0.5 text-xs tk-theme-muted line-through">
                                {formatCurrency(pricing.basePrice)}
                              </p>
                            </div>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600">
                              Oferta activa
                            </p>
                          </div>
                        ) : (
                          <p className="font-display text-xl font-bold tk-theme-text">
                            {formatCurrency(item.precio)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
