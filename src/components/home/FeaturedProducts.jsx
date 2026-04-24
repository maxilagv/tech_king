import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl, createProductSlug } from "@/utils";
import { ArrowUpRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { getProductPricing } from "@/utils/offers";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/utils/cloudinary";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function FeaturedProducts() {
  const { products, loading } = useProducts({ onlyActive: true, featuredOnly: true, limit: 4 });
  const { categories } = useCategories({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();
  
  const sectionRef = useRef(null);

  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.slug || cat.id, cat.nombre])
  );

  useGSAP(() => {
    if (reduceMotion) return;

    gsap.set(".header-elem", { opacity: 0, y: 40 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none none"
      }
    });

    tl.to(".header-elem", {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power4.out"
    });
  }, { scope: sectionRef, dependencies: [reduceMotion] });

  useGSAP(() => {
    if (reduceMotion || products.length === 0) return;
    
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      gsap.fromTo(".product-card", 
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".products-grid",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.fromTo(".product-card", 
        { opacity: 0, y: 20, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".products-grid",
            start: "top 90%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    return () => mm.revert();
  }, { scope: sectionRef, dependencies: [products, reduceMotion] });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 md:px-16 lg:px-24 tk-theme-soft">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <span className="header-elem text-blue-500 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
              Lo mas vendido
            </span>
            <h2 className="header-elem tk-theme-text text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Productos
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-500 bg-clip-text text-transparent">
                destacados
              </span>
            </h2>
          </div>
          <div className="header-elem">
            <Link
              to={createPageUrl("Products")}
              className="tk-theme-muted text-sm tracking-[0.15em] uppercase hover:text-blue-500 transition-colors duration-500 mt-6 md:mt-0 inline-block"
            >
              Ver todo -&gt;
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-blue-100 dark:bg-blue-900/20 mb-4" />
                <div className="h-3 rounded bg-blue-100 dark:bg-blue-900/20 w-2/3 mb-2" />
                <div className="h-4 rounded bg-blue-100 dark:bg-blue-900/20 w-full mb-2" />
                <div className="h-4 rounded bg-blue-100 dark:bg-blue-900/20 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="products-grid py-16 text-center text-sm tk-theme-muted">
            No hay productos destacados.
          </div>
        ) : (
          <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((item, i) => {
              const pricing = getProductPricing(item, offers, 1);
              return (
                <div key={item.id} className="product-card">
                  <Link to={`/products/${createProductSlug(item)}`} className="group block h-full">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-5 tk-theme-surface">
                      <img
                        src={
                          getCloudinaryUrl(
                            item.imagenes?.[0] ||
                            "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=900&q=80",
                            { width: 600, format: "auto", quality: "auto" }
                          )
                        }
                        srcSet={
                          item.imagenes?.[0]
                            ? getCloudinarySrcSet(item.imagenes[0], [300, 600, 900])
                            : undefined
                        }
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        alt={item.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                        decoding="async"
                        width="600"
                        height="800"
                      />
                      <div className="absolute inset-0 bg-[#0A0A0A]/0 group-hover:bg-[#0A0A0A]/20 transition-all duration-500" />
                      {pricing.hasOffer && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 rounded-full bg-orange-500 text-[10px] tracking-[0.15em] uppercase text-white font-semibold shadow-lg">
                            -{pricing.discountPctApplied}%
                          </span>
                        </div>
                      )}
                      
                      {/* Arrow animated using Tailwind group-hover */}
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full tk-theme-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                        <ArrowUpRight className="w-4 h-4 tk-theme-text" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-blue-600 text-[11px] tracking-[0.25em] uppercase font-semibold">
                        {categoryMap[item.categorySlug] || item.categorySlug || "Electronica"}
                      </span>
                      <h3 className="tk-theme-text text-lg font-medium leading-tight group-hover:text-blue-500 transition-colors duration-300">
                        {item.nombre}
                      </h3>
                      {pricing.hasOffer ? (
                        <div className="flex items-end gap-2">
                          <p className="tk-theme-text text-xl font-bold">
                            ${pricing.finalPrice.toFixed(2)}
                          </p>
                          <p className="text-sm tk-theme-muted line-through">
                            ${pricing.basePrice.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="tk-theme-text text-xl font-bold">
                          ${Number(item.precio || 0).toFixed(2)}
                        </p>
                      )}
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
