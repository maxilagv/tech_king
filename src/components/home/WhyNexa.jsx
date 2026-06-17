import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useSpotlight } from "@/hooks/useSpotlight";

const PILLARS = [
  {
    icon: ShieldCheck,
    gradient: "from-blue-600 to-blue-400",
    shadow: "shadow-blue-500/40",
    title: "Garantia real",
    desc: "Productos con respaldo oficial y una respuesta clara si algo falla.",
    stat: "12 meses",
    statLabel: "de garantia minima",
  },
  {
    icon: BadgeCheck,
    gradient: "from-sky-500 to-cyan-400",
    shadow: "shadow-sky-400/40",
    title: "Precio justo",
    desc: "Compramos directo para sostener precios competitivos en minorista y mayorista.",
    stat: "30%",
    statLabel: "menos que en cadenas",
  },
  {
    icon: Zap,
    gradient: "from-emerald-500 to-lime-400",
    shadow: "shadow-emerald-400/40",
    title: "Stock inmediato",
    desc: "Inventario actualizado y despacho el mismo dia habil en productos disponibles.",
    stat: "+500",
    statLabel: "productos disponibles",
  },
];

function Pillar({ pillar, index, reduceMotion }) {
  const Icon = pillar.icon;
  const spotlight = useSpotlight();
  return (
    <motion.div
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      viewport={reduceMotion ? undefined : { once: true, amount: 0.25 }}
      transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="tk-spotlight group relative flex flex-col overflow-hidden rounded-2xl border tk-theme-border bg-[var(--tk-surface)] p-7 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-[box-shadow,border-color] duration-300 hover:border-blue-400/50 hover:shadow-[0_34px_70px_-32px_rgba(15,23,42,0.45)] md:p-8"
    >
      {/* top hairline accent */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/55 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      <div
        className={`relative z-[1] mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${pillar.gradient} shadow-lg ${pillar.shadow} transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105`}
      >
        <Icon className="h-6 w-6 text-white" strokeWidth={1.6} />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
      </div>

      <h3 className="relative z-[1] mb-2.5 font-display text-xl font-bold tk-theme-text">{pillar.title}</h3>
      <p className="relative z-[1] mb-7 text-sm leading-relaxed tk-theme-muted">{pillar.desc}</p>

      <div className="relative z-[1] mt-auto border-t tk-theme-border pt-5">
        <p className="tk-gradient-text font-display text-4xl font-bold leading-none">{pillar.stat}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] tk-theme-muted">
          {pillar.statLabel}
        </p>
      </div>
    </motion.div>
  );
}

export default function WhyNexa() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="tk-landing-band relative overflow-hidden py-20 md:py-28 tk-theme-soft">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      <div className="tk-section-shell relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
          transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-16"
        >
          <span className="tk-kicker mb-3 block">Por que elegirnos</span>
          <h2 className="tk-heading text-4xl md:text-5xl">
            La diferencia <span className="tk-gradient-text">Nexastore</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed tk-theme-muted md:text-base">
            En Once, Buenos Aires, vendemos tecnologia con servicio claro, stock real y precios competitivos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {PILLARS.map((pillar, index) => (
            <Pillar key={pillar.title} pillar={pillar} index={index} reduceMotion={reduceMotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
