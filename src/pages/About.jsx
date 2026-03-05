import React from "react";
import { motion } from "framer-motion";
import { Award, Heart, Leaf, Truck } from "lucide-react";
import Footer from "../components/common/Footer";
import { BRAND_NAME } from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

const values = [
  {
    icon: Award,
    title: "Calidad",
    desc: "Trabajamos con marcas reconocidas y productos con garantia oficial del fabricante.",
  },
  {
    icon: Leaf,
    title: "Sostenibilidad",
    desc: "Promovemos equipos de bajo consumo y opciones de recambio responsable.",
  },
  {
    icon: Heart,
    title: "Soporte",
    desc: "Nuestro equipo tecnico acompana antes, durante y despues de cada compra.",
  },
  {
    icon: Truck,
    title: "Entrega rapida",
    desc: "Despacho agil con embalaje seguro para proteger cada producto.",
  },
];

export default function About() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <div className="tk-theme-bg">
      <section className="relative h-[70vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&q=80"
          alt="About"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120b2f]/85 to-[#24124f]/65" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <motion.span
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              className="text-violet-200 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
            >
              Nuestra historia
            </motion.span>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={reduceMotion ? undefined : { delay: 0.2, duration: 0.6 }}
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              Innovacion y
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                tecnologia
              </span>
            </motion.h1>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -40 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true }}
            transition={reduceMotion ? undefined : { duration: 0.7 }}
          >
            <span className="text-violet-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
              Desde 2026
            </span>
            <h2 className="tk-theme-text text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Tecnologia al alcance de
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent"> todos</span>
            </h2>
            <div className="space-y-4 tk-theme-muted text-sm font-normal leading-relaxed">
              <p>
                {BRAND_NAME} nace con una vision clara: acercar tecnologia confiable, moderna y bien asesorada a cada cliente.
              </p>
              <p>
                Seleccionamos cada producto con foco en rendimiento real, garantia oficial y soporte postventa.
              </p>
              <p>
                Buscamos que comprar sea simple, transparente y con acompanamiento humano en cada paso.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 40 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true }}
            transition={reduceMotion ? undefined : { duration: 0.7 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80"
                alt="Our story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white p-6 rounded-2xl shadow-2xl shadow-violet-500/30">
              <span className="text-3xl font-bold">5000+</span>
              <p className="text-xs text-white/85 tracking-wide uppercase mt-1 font-medium">Productos disponibles</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-16 lg:px-24 tk-theme-soft">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={reduceMotion ? undefined : { once: true }}
            className="text-center mb-16"
          >
            <span className="text-violet-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
              Valores
            </span>
            <h2 className="tk-theme-text text-3xl md:text-4xl font-bold tracking-tight">
              Lo que nos
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent"> define</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reduceMotion ? undefined : { once: true }}
                transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.5 }}
                className="tk-theme-surface p-8 rounded-2xl border tk-theme-border hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/25">
                  <value.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="tk-theme-text text-base font-semibold mb-2">{value.title}</h3>
                <p className="tk-theme-muted text-sm leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
