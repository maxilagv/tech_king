import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Background Image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920&q=80"
          alt="Electronics"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900" />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[10%] top-0 bottom-0 w-px bg-white/[0.04]" />
        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-white/[0.04]" />
        <div className="absolute left-[90%] top-0 bottom-0 w-px bg-white/[0.04]" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-20 md:pb-32 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
        {/* Tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 text-cyan-300 text-xs tracking-[0.3em] uppercase bg-cyan-500/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Tecnología de Vanguardia
          </span>
        </motion.div>

        {/* Title */}
        <div className="overflow-hidden mb-4">
          <motion.h1
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="text-white text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight"
          >
            El futuro de la
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-8">
          <motion.h1
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="text-white text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight"
          >
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">tecnología</span>
          </motion.h1>
        </div>

        {/* Description + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="flex flex-col md:flex-row md:items-end gap-6 md:gap-16"
        >
          <p className="text-white/60 text-base md:text-lg max-w-md font-normal leading-relaxed">
            Los mejores productos electrónicos y electrodomésticos al mejor precio.
            Innovación, calidad y garantía en cada compra.
          </p>

          <Link
            to={createPageUrl("Products")}
            className="group flex items-center gap-4 text-white text-sm tracking-[0.15em] uppercase hover:text-cyan-300 transition-colors duration-500"
          >
            <span>Ver productos</span>
            <motion.div
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-cyan-400/40 group-hover:bg-cyan-500/20 transition-all duration-500"
              whileHover={{ scale: 1.1 }}
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/30" />
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
      </motion.div>
    </section>
  );
}
