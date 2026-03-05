import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

const testimonials = [
  {
    name: "Roberto Sanchez",
    role: "Analista de producto",
    text: "Excelente atencion, precios claros y entrega super rapida. La compra fue simple y sin sorpresas.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    name: "Laura Fernandez",
    role: "Streamer",
    text: "Consegui todo para mi setup gamer en un solo lugar. El asesoramiento tecnico fue impecable.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    name: "Miguel Torres",
    role: "Desarrollador",
    text: "Compre equipos para oficina y hogar. Todo llego en perfectas condiciones y con garantia real.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  },
];

export default function TestimonialsSection() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 bg-[#130b31] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/12 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/12 rounded-full blur-2xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={reduceMotion ? undefined : { duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-violet-200 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
            Testimonios
          </span>
          <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
            Lo que dicen nuestros <span className="text-fuchsia-300">clientes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={reduceMotion ? false : { opacity: 0, y: 32 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reduceMotion ? undefined : { once: true }}
              transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.5 }}
              className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 hover:bg-white/[0.08] hover:border-violet-300/25 transition-all duration-300"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, ratingIndex) => (
                  <Star key={ratingIndex} className="w-4 h-4 fill-violet-300 text-violet-300" />
                ))}
              </div>

              <p className="text-white/80 text-sm leading-relaxed mb-8">"{testimonial.text}"</p>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-300/35"
                  loading="lazy"
                />
                <div>
                  <p className="text-white text-sm font-medium">{testimonial.name}</p>
                  <p className="text-white/50 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
