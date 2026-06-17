import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useSpotlight } from "@/hooks/useSpotlight";

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

function TestimonialCard({ testimonial, index, reduceMotion }) {
  const spotlight = useSpotlight();
  return (
    <motion.div
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      viewport={reduceMotion ? undefined : { once: true, amount: 0.25 }}
      transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="tk-spotlight group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-sm transition-[box-shadow,border-color,background-color] duration-300 hover:border-blue-300/35 hover:bg-white/[0.08] hover:shadow-[0_36px_70px_-32px_rgba(0,0,0,0.75)] md:p-8"
    >
      <span className="pointer-events-none absolute right-5 top-1 select-none font-display text-[6rem] leading-none text-white/[0.07]">
        &rdquo;
      </span>

      <div className="relative z-[1] mb-5 flex gap-1">
        {Array.from({ length: testimonial.rating }).map((_, ratingIndex) => (
          <Star key={ratingIndex} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.35)]" />
        ))}
      </div>

      <p className="relative z-[1] mb-7 text-[15px] leading-relaxed text-white/85">&ldquo;{testimonial.text}&rdquo;</p>

      <div className="relative z-[1] mt-auto flex items-center gap-3 border-t border-white/10 pt-5">
        <span className="inline-flex rounded-xl bg-gradient-to-br from-blue-400 to-cyan-300 p-[1.5px] shadow-lg shadow-blue-500/20">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="h-11 w-11 rounded-[10px] object-cover"
            loading="lazy"
          />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{testimonial.name}</p>
          <p className="text-xs text-blue-200/70">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const reduceMotion = useShouldReduceMotion();

  return (
    <section className="tk-landing-band relative overflow-hidden bg-[#071530] py-20 md:py-28">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-blue-600/15 blur-[150px]" />
        <div className="absolute -right-20 bottom-0 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[160px]" />
      </div>

      <div className="tk-section-shell relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
          transition={reduceMotion ? undefined : { duration: 0.55 }}
          className="mb-12 max-w-2xl md:mb-16"
        >
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.24em] text-blue-200">
            Testimonios
          </span>
          <h2 className="font-display text-4xl font-bold tracking-[0] text-white md:text-5xl">
            Lo que dicen nuestros{" "}
            <span className="tk-gradient-text-bright">clientes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
