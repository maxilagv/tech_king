import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 bg-[#F5F0EB] relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#C9A96E]/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#C9A96E]/5 pointer-events-none" />

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
            Newsletter
          </span>
          <h2 className="text-[#0A0A0A] text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Recibe ofertas <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">exclusivas</span>
          </h2>
          <p className="text-[#0A0A0A]/60 text-sm font-normal mb-10 max-w-md mx-auto">
            Sé el primero en conocer nuevos lanzamientos, descuentos especiales y ofertas en productos tech.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white border border-[#0A0A0A]/10 text-[#0A0A0A] text-sm placeholder:text-[#0A0A0A]/30 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-blue-400 transition-all duration-500 shadow-lg shadow-blue-500/30"
            >
              {submitted ? (
                "¡Suscrito! ✓"
              ) : (
                <>
                  Suscribirse
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
