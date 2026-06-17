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
    <section className="tk-landing-band relative overflow-hidden bg-[#071530] py-20 md:py-28">
      <div className="tk-section-shell relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
          transition={reduceMotion ? undefined : { duration: 0.55 }}
          className="mb-12 max-w-2xl md:mb-14"
        >
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.24em] text-blue-200">
            Testimonios
          </span>
          <h2 className="font-display text-4xl font-bold tracking-[0] text-white md:text-5xl">
            Lo que dicen nuestros <span className="text-blue-300">clientes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-white/10 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reduceMotion ? undefined : { once: true, amount: 0.25 }}
              transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.5 }}
              className="group border-b border-white/10 bg-white/[0.045] p-6 transition-colors duration-300 hover:bg-white/[0.075] last:border-b-0 md:border-b-0 md:border-r md:p-8 md:last:border-r-0"
            >
              <div className="mb-6 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, ratingIndex) => (
                  <Star key={ratingIndex} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="mb-8 text-sm leading-relaxed text-white/80">"{testimonial.text}"</p>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/18"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-white/50">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
