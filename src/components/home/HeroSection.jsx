import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useLandingHeroes } from "@/hooks/useLandingHeroes";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";
import { normalizeLandingHeroSlide } from "@/utils/landingHeroes";
import { getCloudinaryUrl, getCloudinarySrcSet } from "@/utils/cloudinary";
import { BRAND_NAME } from "@/constants/brand";
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
        className="hero-text-elem tk-pressable inline-flex min-h-12 items-center gap-3 rounded-lg border border-white/25 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#07111f] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-colors hover:bg-blue-50 sm:px-6"
      >
        {slide.ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </a>
    );
  }

  return (
    <Link
      to={slide.ctaUrl}
      className="hero-text-elem tk-pressable inline-flex min-h-12 items-center gap-3 rounded-lg border border-white/25 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#07111f] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-colors hover:bg-blue-50 sm:px-6"
    >
      {slide.ctaLabel}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function HeroSlideImage({ slide, imageRef }) {
  // Apply Cloudinary auto-format (WebP/AVIF) + quality + responsive sizes
  const desktopSrc = getCloudinaryUrl(slide.imagenDesktop, { width: 1920, quality: "auto", format: "auto" });
  const mobileSrc = slide.imagenMobile
    ? getCloudinaryUrl(slide.imagenMobile, { width: 900, quality: "auto", format: "auto" })
    : null;
  const desktopSrcSet = getCloudinarySrcSet(slide.imagenDesktop, [800, 1200, 1920]);

  return (
    <picture>
      {mobileSrc && (
        <source
          media="(max-width: 767px)"
          srcSet={getCloudinarySrcSet(slide.imagenMobile, [480, 768, 900])}
          sizes="100vw"
          type="image/webp"
        />
      )}
      <img
        ref={imageRef}
        src={desktopSrc}
        srcSet={desktopSrcSet}
        alt={slide.titulo || "Hero"}
        className="hero-image h-full w-full object-cover origin-center"
        fetchpriority="high"
        loading="eager"
        decoding="async"
        sizes="100vw"
        width="1920"
        height="1080"
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

  // While heroes are loading from Firestore, show a placeholder that:
  // - reserves the exact same space as the hero (prevents CLS)
  // - matches the background color so there's no flash
  if (slides.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="tk-mobile-section relative min-h-[90vh] md:min-h-screen w-full bg-[#020c1e]"
      />
    );
  }

  const activeSlide = slides[index];
  const heroHeightClass = "min-h-[100svh] md:min-h-screen";
  const contentSpacingClass = isDark ? "pb-8 pt-24 md:pb-14 md:pt-32" : "pb-10 pt-24 md:pb-16 md:pt-40";
  const titleSizeClass = isDark
    ? "text-[2.65rem] md:text-6xl lg:text-7xl"
    : "text-[2.65rem] md:text-6xl lg:text-8xl";
  const headlineClass = "hero-text-elem mt-4 max-w-4xl text-2xl font-semibold leading-[1.05] tracking-[0] text-white/92 md:text-4xl lg:text-5xl";
  const overlayMainClass = isDark
    ? "absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,30,0.94)_0%,rgba(2,12,30,0.72)_42%,rgba(2,12,30,0.26)_100%)]"
    : "absolute inset-0 bg-[linear-gradient(90deg,rgba(2,12,30,0.96)_0%,rgba(2,12,30,0.8)_48%,rgba(2,12,30,0.42)_100%)]";
  const overlayBottomClass = isDark
    ? "absolute inset-0 bg-[linear-gradient(to_top,rgba(2,12,30,0.98),rgba(2,12,30,0.36)_42%,rgba(2,12,30,0.12))]"
    : "absolute inset-0 bg-[linear-gradient(to_top,rgba(2,12,30,0.99),rgba(2,12,30,0.5)_42%,rgba(2,12,30,0.22))]";
  const badgeClass = isDark
    ? "hero-text-elem inline-flex w-fit items-center gap-2 rounded-lg border border-white/18 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-blue-50"
    : "hero-text-elem inline-flex w-fit items-center gap-2 rounded-lg border border-white/18 bg-black/32 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] backdrop-blur-sm";
  const subtitleClass = isDark
    ? "hero-text-elem mt-4 max-w-xl text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/90 md:text-base"
    : "hero-text-elem mt-4 max-w-xl text-sm font-semibold uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] md:text-base";
  const descriptionClass = isDark
    ? "hero-text-elem max-w-xl text-sm leading-relaxed text-white/74 md:text-lg"
    : "hero-text-elem max-w-xl text-sm leading-relaxed text-white/92 drop-shadow-[0_2px_8px_rgba(0,0,0,0.88)] md:text-lg";
  const showSubtitle =
    activeSlide.subtitulo &&
    activeSlide.subtitulo.trim().toLowerCase() !== BRAND_NAME.toLowerCase();

  return (
    <section ref={sectionRef} className={`tk-mobile-section relative ${heroHeightClass} w-full overflow-hidden bg-[#020c1e]`}>
      <div className="absolute inset-0">
        <HeroSlideImage slide={activeSlide} imageRef={imageRef} />
        <div className={overlayMainClass} />
        <div className={overlayBottomClass} />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.02)_28%,transparent_29%,transparent_100%)] mix-blend-screen" />
      </div>

      <div
        className={`relative z-10 mx-auto flex ${heroHeightClass} max-w-7xl flex-col justify-end px-5 ${contentSpacingClass} sm:px-6 md:px-16 lg:px-24`}
        style={{ perspective: "1000px" }}
      >
        <div className={badgeClass}>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
          {activeSlide.badge || "Nuevos ingresos"}
        </div>

        <h1
          key={`${activeSlide.id}-brand`}
          className={`hero-text-elem mt-5 max-w-5xl font-semibold leading-[0.94] tracking-[0] text-white ${titleSizeClass}`}
        >
          {BRAND_NAME}
        </h1>

        <p key={`${activeSlide.id}-title`} className={headlineClass}>
          {activeSlide.titulo}
        </p>

        {showSubtitle && (
          <p
            key={`${activeSlide.id}-subtitle`}
            className={subtitleClass}
          >
            {activeSlide.subtitulo}
          </p>
        )}

        <div
          key={`${activeSlide.id}-desc`}
          className="mt-6 flex flex-col gap-5 md:mt-7 md:flex-row md:items-end md:justify-between"
        >
          <p className={descriptionClass}>
            {activeSlide.descripcion}
          </p>
          <SlideAction slide={activeSlide} />
        </div>

        <div className="hero-text-elem mt-7 flex items-center justify-between gap-4 md:mt-10">
          <div className="flex items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  dotIndex === index ? "w-10 bg-white" : "w-2 bg-white/42 hover:bg-white/72"
                }`}
                aria-label={`Ir al slide ${dotIndex + 1}`}
              />
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="tk-pressable inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/18"
              aria-label="Slide anterior"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
              className="tk-pressable inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/18"
              aria-label="Slide siguiente"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <a
          href="#home-offers"
          aria-label="Ver siguientes secciones"
          className="hero-text-elem absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/62 transition-colors hover:text-white md:inline-flex"
        >
          <ChevronDown className="h-4 w-4 animate-bounce" />
          Explorar
        </a>
      </div>
    </section>
  );
}
