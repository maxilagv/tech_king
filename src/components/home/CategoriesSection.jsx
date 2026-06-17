import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCategories } from "@/hooks/useCategories";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useSpotlight } from "@/hooks/useSpotlight";
import { Skeleton } from "@/components/ui/Skeleton";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function CategoryCard({ cat, targetUrl }) {
  const spotlight = useSpotlight();
  return (
    <div className="category-card">
      <Link
        ref={spotlight.ref}
        onMouseMove={spotlight.onMouseMove}
        to={targetUrl}
        className="tk-image-lift tk-spotlight group relative block aspect-[4/5] overflow-hidden rounded-lg"
      >
        <img
          src={cat.imagen}
          alt={cat.nombre}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020c1e]/86 via-[#020c1e]/26 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 md:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/58">
                {cat.productos || "-"} productos
              </span>
              <h3 className="text-3xl font-semibold tracking-[0] text-white md:text-4xl">
                {cat.nombre}
              </h3>
              {cat.descripcion && (
                <p className="mt-2 line-clamp-2 text-sm font-normal leading-relaxed text-white/68">
                  {cat.descripcion}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white transition-all duration-500 group-hover:bg-white/12 group-hover:translate-x-1">
              <span className="text-lg font-light">-&gt;</span>
            </div>
          </div>
        </div>

        <div className="absolute left-5 top-5 z-10 md:left-6 md:top-6">
          <span className="inline-block rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-md">
            {cat.nombre}
          </span>
        </div>
      </Link>
    </div>
  );
}

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
    <section ref={sectionRef} className="tk-landing-band py-20 md:py-28 tk-theme-surface">
      <div className="tk-section-shell">
        <div className="mb-10 max-w-2xl md:mb-14">
          <span className="cat-header tk-kicker mb-4 block">
            Categorias
          </span>
          <h2 className="cat-header tk-heading text-4xl md:text-5xl">
            Explora por{" "}
            <span className="text-blue-600">
              categoria
            </span>
          </h2>
          <p className="cat-header mt-4 text-sm leading-relaxed tk-theme-muted md:text-base">
            Accesos rapidos a los rubros que mas se buscan en tienda.
          </p>
        </div>

        {loading ? (
          <div className="categories-grid grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="categories-grid py-16 text-center text-sm tk-theme-muted">
            No hay categorias cargadas.
          </div>
        ) : (
          <div className="categories-grid grid grid-cols-1 gap-4 md:grid-cols-3">
            {categories.map((cat) => {
              const categoryKey = cat.slug || cat.id;
              const targetUrl = categoryKey
                ? `${createPageUrl("Products")}?category=${encodeURIComponent(categoryKey)}`
                : createPageUrl("Products");

              return <CategoryCard key={cat.id} cat={cat} targetUrl={targetUrl} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
