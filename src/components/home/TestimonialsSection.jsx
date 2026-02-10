import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Roberto Sánchez",
    role: "Tech Reviewer",
    text: "Los mejores precios del mercado y productos originales. Compré mi MacBook aquí y llegó perfectamente empaquetado en 24 horas.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    name: "Laura Fernández",
    role: "Gamer Profesional",
    text: "Increíble selección de productos gaming. Encontré todo lo que necesitaba para mi setup. Atención al cliente de 10.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    name: "Miguel Torres",
    role: "Ingeniero de Software",
    text: "Compré varios dispositivos para mi oficina. Garantía extendida, envío rápido y productos de calidad. Totalmente recomendado.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.02] rounded-full blur-2xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
            Testimonios
          </span>
          <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
            Lo que dicen nuestros <span className="text-cyan-300">clientes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
              className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all duration-500"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                ))}
              </div>

              <p className="text-white/70 text-sm leading-relaxed mb-8 font-light">
                "{t.text}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-400/30"
                />
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
