import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

const PILLARS = [
  {
    icon: ShieldCheck,
    gradient: "from-blue-600 to-blue-400",
    shadow: "shadow-blue-500/30",
    title: "Garantía real",
    desc: "Todos nuestros productos tienen garantía oficial del fabricante. Si algo falla, lo resolvemos — sin burocracia.",
    stat: "12 meses",
    statLabel: "de garantía mínima",
  },
  {
    icon: BadgeCheck,
    gradient: "from-sky-500 to-cyan-400",
    shadow: "shadow-sky-400/30",
    title: "Precio justo",
    desc: "Compramos directo sin intermediarios. Tenés acceso a precios mayoristas sin importar cuánto comprés.",
    stat: "30%",
    statLabel: "menos que en cadenas",
  },
  {
    icon: Zap,
    gradient: "from-violet-500 to-fuchsia-400",
    shadow: "shadow-violet-400/30",
    title: "Stock inmediato",
    desc: "Inventario actualizado en tiempo real. Si dice disponible, está. Despacho el mismo día hábil.",
    stat: "+500",
    statLabel: "productos disponibles",
  },
];

export default function WhyNexa() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 relative overflow-hidden tk-theme-soft">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-[10%] w-[380px] h-[380px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[8%] w-[320px] h-[320px] rounded-full bg-violet-500/10 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={reduceMotion ? undefined : { duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-blue-500 text-xs tracking-[0.3em] uppercase font-semibold block mb-3">
            Por qué elegirnos
          </span>
          <h2 className="tk-theme-text text-4xl md:text-5xl font-bold font-display tracking-tight">
            La diferencia{" "}
            <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Nexastore
            </span>
          </h2>
          <p className="tk-theme-muted text-base mt-4 max-w-xl mx-auto leading-relaxed">
            En Once, Buenos Aires, vendemos tecnología con la seriedad que merecés. Tres pilares que nos distinguen.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reduceMotion ? undefined : { once: true }}
                transition={reduceMotion ? undefined : { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:border-blue-300/25 hover:bg-white/8 transition-all duration-500"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

                <div
                  className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.gradient} items-center justify-center shadow-lg ${pillar.shadow} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>

                <h3 className="tk-theme-text text-xl font-bold font-display mb-3">{pillar.title}</h3>
                <p className="tk-theme-muted text-sm leading-relaxed mb-8">{pillar.desc}</p>

                <div className="border-t border-white/10 pt-6">
                  <p className="text-3xl font-bold font-display bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                    {pillar.stat}
                  </p>
                  <p className="text-xs tk-theme-muted mt-1 uppercase tracking-[0.15em]">{pillar.statLabel}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
