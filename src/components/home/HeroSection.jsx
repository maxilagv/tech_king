import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLandingHeroes } from "@/hooks/useLandingHeroes";
import { LANDING_HERO_FALLBACK_SLIDES } from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";

function normalizeSlide(slide, index) {
  return {
    id: slide.id || `slide-${index}`,
    titulo: String(slide.titulo || "").trim(),
    subtitulo: String(slide.subtitulo || "").trim(),
    descripcion: String(slide.descripcion || "").trim(),
    badge: String(slide.badge || "").trim(),
    ctaLabel: String(slide.ctaLabel || "Ver catalogo").trim(),
    ctaUrl: String(slide.ctaUrl || "/products").trim(),
    imagen: String(slide.imagen || "").trim(),
    orden: Number(slide.orden || index),
    activo: slide.activo !== false,
  };
}

function SlideAction({ slide }) {
  const isExternal = /^https?:\/\//i.test(slide.ctaUrl);
  if (isExternal) {
    return (
      <a
        href={slide.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white hover:bg-white/20 transition"
      >
        {slide.ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </a>
    );
  }

  return (
    <Link
      to={slide.ctaUrl}
      className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white hover:bg-white/20 transition"
    >
      {slide.ctaLabel}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export default function HeroSection() {
  const { heroes } = useLandingHeroes({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();
  const { isDark } = useTheme();
  const slides = useMemo(() => {
    const source = heroes.length > 0 ? heroes : LANDING_HERO_FALLBACK_SLIDES;
    return source
      .map((slide, index) => normalizeSlide(slide, index))
      .filter((slide) => slide.activo && slide.imagen)
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

  if (slides.length === 0) return null;

  const activeSlide = slides[index];
  const heroHeightClass = isDark
    ? "min-h-[98vh] md:min-h-[100vh]"
    : "min-h-[108vh] md:min-h-[114vh]";
  const contentSpacingClass = isDark ? "pb-16 pt-32" : "pb-24 pt-40 md:pt-44";
  const titleSizeClass = isDark
    ? "text-4xl md:text-6xl lg:text-7xl"
    : "text-5xl md:text-7xl lg:text-8xl";
  const overlayMainClass = isDark
    ? "absolute inset-0 bg-gradient-to-r from-[#09051f]/85 via-[#120b2f]/62 to-[#0a0822]/78"
    : "absolute inset-0 bg-gradient-to-r from-[#09051f]/92 via-[#120b2f]/78 to-[#0a0822]/88";
  const overlayBottomClass = isDark
    ? "absolute inset-0 bg-[linear-gradient(to_top,rgba(9,5,31,0.96),rgba(9,5,31,0.28)_38%,rgba(9,5,31,0.12))]"
    : "absolute inset-0 bg-[linear-gradient(to_top,rgba(9,5,31,0.99),rgba(9,5,31,0.5)_42%,rgba(9,5,31,0.22))]";
  const badgeClass = isDark
    ? "inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-300/35 bg-fuchsia-400/15 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-fuchsia-100"
    : "inline-flex w-fit items-center gap-2 rounded-full border border-white/35 bg-black/40 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] backdrop-blur-sm";
  const subtitleClass = isDark
    ? "mt-3 text-base uppercase tracking-[0.25em] text-violet-200/90 md:text-lg"
    : "mt-3 inline-flex w-fit rounded-full border border-white/20 bg-black/35 px-3 py-1 text-sm uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] md:text-base";
  const descriptionClass = isDark
    ? "max-w-2xl text-sm leading-relaxed text-white/72 md:text-lg"
    : "max-w-2xl text-sm leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] md:text-lg";

  return (
    <section className={`relative ${heroHeightClass} w-full overflow-hidden bg-[#120b2f]`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-[-12%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/30 blur-[140px]" />
        <div className="absolute bottom-[-180px] right-[-10%] h-[520px] w-[520px] rounded-full bg-indigo-500/35 blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.22),transparent_40%)]" />
      </div>

      {reduceMotion ? (
        <div className="absolute inset-0">
          <img
            src={activeSlide.imagen}
            alt={activeSlide.titulo || "Hero"}
            className="h-full w-full object-cover"
            fetchpriority="high"
          />
          <div className={overlayMainClass} />
          <div className={overlayBottomClass} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0.15, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.12, scale: 1.02 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={activeSlide.imagen}
              alt={activeSlide.titulo || "Hero"}
              className="h-full w-full object-cover"
              fetchpriority="high"
            />
            <div className={overlayMainClass} />
            <div className={overlayBottomClass} />
          </motion.div>
        </AnimatePresence>
      )}

      <div
        className={`relative z-10 mx-auto flex ${heroHeightClass} max-w-7xl flex-col justify-end px-6 ${contentSpacingClass} md:px-16 lg:px-24`}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.55 }}
          className={badgeClass}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
          {activeSlide.badge || "Nuevos ingresos"}
        </motion.div>

        <motion.h1
          key={`${activeSlide.id}-title`}
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 0.12, duration: 0.7 }}
          className={`mt-5 max-w-5xl font-semibold leading-[0.92] tracking-tight text-white ${titleSizeClass}`}
        >
          {activeSlide.titulo}
        </motion.h1>

        {activeSlide.subtitulo && (
          <motion.p
            key={`${activeSlide.id}-subtitle`}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { delay: 0.18, duration: 0.7 }}
            className={subtitleClass}
          >
            {activeSlide.subtitulo}
          </motion.p>
        )}

        <motion.div
          key={`${activeSlide.id}-desc`}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 0.24, duration: 0.7 }}
          className="mt-7 flex flex-col gap-7 md:flex-row md:items-end md:justify-between"
        >
          <p className={descriptionClass}>
            {activeSlide.descripcion}
          </p>
          <SlideAction slide={activeSlide} />
        </motion.div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index ? "w-9 bg-fuchsia-200" : "w-2.5 bg-white/45 hover:bg-white/70"
                }`}
                aria-label={`Ir al slide ${dotIndex + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
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
