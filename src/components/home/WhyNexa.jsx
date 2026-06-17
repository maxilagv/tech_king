import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

const PILLARS = [
  {
    icon: ShieldCheck,
    gradient: "from-blue-600 to-blue-400",
    shadow: "shadow-blue-500/30",
    title: "Garantia real",
    desc: "Productos con respaldo oficial y una respuesta clara si algo falla.",
    stat: "12 meses",
    statLabel: "de garantia minima",
  },
  {
    icon: BadgeCheck,
    gradient: "from-sky-500 to-cyan-400",
    shadow: "shadow-sky-400/30",
    title: "Precio justo",
    desc: "Compramos directo para sostener precios competitivos en minorista y mayorista.",
    stat: "30%",
    statLabel: "menos que en cadenas",
  },
  {
    icon: Zap,
    gradient: "from-emerald-500 to-lime-400",
    shadow: "shadow-emerald-400/30",
    title: "Stock inmediato",
    desc: "Inventario actualizado y despacho el mismo dia habil en productos disponibles.",
    stat: "+500",
    statLabel: "productos disponibles",
  },
];

export default function WhyNexa() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="tk-landing-band relative overflow-hidden py-20 md:py-28 tk-theme-soft">
      <div className="tk-section-shell relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
          transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-12 max-w-2xl text-center md:mb-14"
        >
          <span className="tk-kicker mb-3 block">Por que elegirnos</span>
          <h2 className="tk-heading text-4xl md:text-5xl">
            La diferencia <span className="text-blue-600">Nexastore</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed tk-theme-muted md:text-base">
            En Once, Buenos Aires, vendemos tecnologia con servicio claro, stock real y precios competitivos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 overflow-hidden rounded-lg border tk-theme-border md:grid-cols-3">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={reduceMotion ? false : { opacity: 0, y: 34 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reduceMotion ? undefined : { once: true, amount: 0.25 }}
                transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="group relative border-b tk-theme-border bg-[var(--tk-surface)] p-6 transition-colors duration-500 hover:bg-[var(--tk-bg)] last:border-b-0 md:border-b-0 md:border-r md:p-8 md:last:border-r-0"
              >
                <div
                  className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${pillar.gradient} shadow-lg ${pillar.shadow} transition-transform duration-300 group-hover:-translate-y-1 md:h-14 md:w-14`}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>

                <h3 className="mb-3 font-display text-xl font-bold tk-theme-text">{pillar.title}</h3>
                <p className="mb-8 text-sm leading-relaxed tk-theme-muted">{pillar.desc}</p>

                <div className="border-t tk-theme-border pt-6">
                  <p className="font-display text-3xl font-bold text-blue-600">{pillar.stat}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] tk-theme-muted">{pillar.statLabel}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
