import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLandingHeroes } from "@/hooks/useLandingHeroes";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";
import { normalizeLandingHeroSlide } from "@/utils/landingHeroes";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

function SlideAction({ slide }) {
  const isExternal = /^https?:\/\//i.test(slide.ctaUrl);
  if (isExternal) {
    return (
      <a
        href={slide.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hero-text-elem inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white hover:bg-white/20 transition-colors"
      >
        {slide.ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </a>
    );
  }

  return (
    <Link
      to={slide.ctaUrl}
      className="hero-text-elem inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white hover:bg-white/20 transition-colors"
    >
      {slide.ctaLabel}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function HeroSlideImage({ slide, imageRef }) {
  return (
    <picture>
      {slide.imagenMobile && (
        <source
          media="(max-width: 767px)"
          srcSet={slide.imagenMobile}
          sizes="100vw"
        />
      )}
      <img
        ref={imageRef}
        src={slide.imagenDesktop}
        alt={slide.titulo || "Hero"}
        className="hero-image h-full w-full object-cover origin-center"
        fetchPriority="high"
        decoding="async"
        sizes="100vw"
      />
    </picture>
  );
}

export default function HeroSection() {
  const { heroes } = useLandingHeroes({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const imageRef = useRef(null);

  const slides = useMemo(() => {
    return heroes
      .map((slide, index) => normalizeLandingHeroSlide(slide, index))
      .filter((slide) => slide.activo && slide.imagenDesktop)
      .sort((a, b) => a.orden - b.orden);
  }, [heroes]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    setIndex((prev) => Math.min(prev, slides.length - 1));
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 7500);
    return () => window.clearInterval(timer);
  }, [slides.length, reduceMotion]);

  useGSAP(() => {
    if (reduceMotion || slides.length === 0) return;

    // Reset properties to ensure clean animation state across renders
    gsap.set(".hero-text-elem", { opacity: 0, y: 30, rotationX: 10 });
    if (imageRef.current) {
        gsap.set(imageRef.current, { scale: 1.05, opacity: 0 });
    }

    const tl = gsap.timeline();

    // Background Image Animation
    if (imageRef.current) {
        tl.to(imageRef.current, {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out"
        }, 0);
    }

    // Text Elements Stagger Animation
    tl.to(".hero-text-elem", {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform" // clear props after animation to prevent issues with other CSS rules
    }, "-=0.8");

  }, { scope: sectionRef, dependencies: [index, reduceMotion, slides.length] });

  if (slides.length === 0) return null;

  const activeSlide = slides[index];
  const heroHeightClass = "min-h-[90vh] md:min-h-screen";
  const contentSpacingClass = isDark ? "pb-14 pt-28 md:pt-32" : "pb-20 pt-32 md:pt-40";
  const titleSizeClass = isDark
    ? "text-4xl md:text-6xl lg:text-7xl"
    : "text-4xl md:text-6xl lg:text-8xl";
  const overlayMainClass = isDark
    ? "absolute inset-0 bg-gradient-to-r from-[#020c1e]/85 via-[#071530]/62 to-[#020c1e]/78"
    : "absolute inset-0 bg-gradient-to-r from-[#020c1e]/92 via-[#071530]/78 to-[#020c1e]/88";
  const overlayBottomClass = isDark
    ? "absolute inset-0 bg-[linear-gradient(to_top,rgba(2,12,30,0.96),rgba(2,12,30,0.28)_38%,rgba(2,12,30,0.12))]"
    : "absolute inset-0 bg-[linear-gradient(to_top,rgba(2,12,30,0.99),rgba(2,12,30,0.5)_42%,rgba(2,12,30,0.22))]";
  const badgeClass = isDark
    ? "hero-text-elem inline-flex w-fit items-center gap-2 rounded-full border border-blue-300/35 bg-blue-400/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-blue-100"
    : "hero-text-elem inline-flex w-fit items-center gap-2 rounded-full border border-white/35 bg-black/40 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] backdrop-blur-sm";
  const subtitleClass = isDark
    ? "hero-text-elem mt-3 text-base uppercase tracking-[0.25em] text-blue-200/90 md:text-lg"
    : "hero-text-elem mt-3 inline-flex w-fit rounded-full border border-white/20 bg-black/35 px-3 py-1 text-sm uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] md:text-base";
  const descriptionClass = isDark
    ? "hero-text-elem max-w-2xl text-sm leading-relaxed text-white/72 md:text-lg"
    : "hero-text-elem max-w-2xl text-sm leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] md:text-lg";

  return (
    <section ref={sectionRef} className={`tk-mobile-section relative ${heroHeightClass} w-full overflow-hidden bg-[#020c1e]`}>
      {!reduceMotion && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-[-12%] h-[420px] w-[420px] rounded-full bg-blue-500/30 blur-[140px]" />
          <div className="absolute bottom-[-180px] right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-500/35 blur-[180px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.22),transparent_40%)]" />
        </div>
      )}

      <div className="absolute inset-0">
        <HeroSlideImage slide={activeSlide} imageRef={imageRef} />
        <div className={overlayMainClass} />
        <div className={overlayBottomClass} />
      </div>

      <div
        className={`relative z-10 mx-auto flex ${heroHeightClass} max-w-7xl flex-col justify-end px-6 ${contentSpacingClass} md:px-16 lg:px-24`}
        style={{ perspective: "1000px" }}
      >
        <div className={badgeClass}>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
          {activeSlide.badge || "Nuevos ingresos"}
        </div>

        <h1
          key={`${activeSlide.id}-title`}
          className={`hero-text-elem mt-5 max-w-5xl font-semibold leading-[0.92] tracking-tight text-white ${titleSizeClass}`}
        >
          {activeSlide.titulo}
        </h1>

        {activeSlide.subtitulo && (
          <p
            key={`${activeSlide.id}-subtitle`}
            className={subtitleClass}
          >
            {activeSlide.subtitulo}
          </p>
        )}

        <div
          key={`${activeSlide.id}-desc`}
          className="mt-7 flex flex-col gap-7 md:flex-row md:items-end md:justify-between"
        >
          <p className={descriptionClass}>
            {activeSlide.descripcion}
          </p>
          <SlideAction slide={activeSlide} />
        </div>

        <div className="hero-text-elem mt-8 md:mt-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index ? "w-9 bg-blue-200" : "w-2.5 bg-white/45 hover:bg-white/70"
                }`}
                aria-label={`Ir al slide ${dotIndex + 1}`}
              />
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Slide anterior"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Slide siguiente"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
