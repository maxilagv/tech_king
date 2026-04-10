import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCategories } from "@/hooks/useCategories";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function CategoriesSection() {
  const { categories, loading } = useCategories({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();
  const sectionRef = useRef(null);

  useGSAP(() => {
    if (reduceMotion) return;

    gsap.set(".cat-header", { opacity: 0, y: 30 });
    
    // Header Animation
    gsap.to(".cat-header", {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      },
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out"
    });

  }, { scope: sectionRef, dependencies: [reduceMotion] });

  useGSAP(() => {
    if (reduceMotion || categories.length === 0) return;

    gsap.set(".category-card", { opacity: 0, y: 50 });

    // Cards Animation
    gsap.to(".category-card", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".categories-grid",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

  }, { scope: sectionRef, dependencies: [categories, reduceMotion] });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 md:px-16 lg:px-24 tk-theme-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="cat-header text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
            Categorias
          </span>
          <h2 className="cat-header tk-theme-text text-4xl md:text-5xl font-bold tracking-tight">
            Explora por{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              categoria
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="categories-grid grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse aspect-[4/5] rounded-3xl bg-[var(--tk-field-bg)]"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="categories-grid py-16 text-center text-sm tk-theme-muted">
            No hay categorias cargadas.
          </div>
        ) : (
          <div className="categories-grid grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat, i) => {
              const categoryKey = cat.slug || cat.id;
              const targetUrl = categoryKey
                ? `${createPageUrl("Products")}?category=${encodeURIComponent(categoryKey)}`
                : createPageUrl("Products");

              return (
              <div key={cat.id} className="category-card">
                <Link
                  to={targetUrl}
                  className="group relative block aspect-[4/5] rounded-3xl overflow-hidden"
                >
                  <img
                    src={cat.imagen}
                    alt={cat.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-white/50 text-xs tracking-[0.2em] uppercase block mb-2">
                          {cat.productos || "-"} productos
                        </span>
                        <h3 className="text-white text-3xl md:text-4xl font-extralight tracking-tight">
                          {cat.nombre}
                        </h3>
                        {cat.descripcion && (
                          <p className="text-white/60 text-sm mt-1 font-light">
                            {cat.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
                        <span className="text-white text-xl font-light">-&gt;</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-6 left-6">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] tracking-[0.2em] uppercase border border-white/10">
                      {cat.nombre}
                    </span>
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
