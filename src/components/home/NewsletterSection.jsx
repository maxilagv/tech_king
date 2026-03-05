import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reduceMotion = useShouldReduceMotion();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    window.setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 tk-theme-soft relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-[-10%] w-[560px] h-[560px] rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute -bottom-24 right-[-12%] w-[620px] h-[620px] rounded-full bg-fuchsia-500/10 blur-[170px]" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true }}
          transition={reduceMotion ? undefined : { duration: 0.6 }}
        >
          <span className="text-violet-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
            Newsletter
          </span>
          <h2 className="tk-theme-text text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Recibe ofertas{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
              exclusivas
            </span>
          </h2>
          <p className="tk-theme-muted text-sm font-normal mb-10 max-w-md mx-auto">
            Se el primero en conocer lanzamientos, descuentos especiales y novedades de tecnologia.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Tu correo electronico"
              className="flex-1 px-5 py-3.5 rounded-xl bg-[var(--tk-surface)] border border-[var(--tk-border)] text-[var(--tk-text)] text-sm placeholder:text-[var(--tk-muted)] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300"
            />
            <motion.button
              type="submit"
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:from-violet-500 hover:to-fuchsia-400 transition-all duration-300 shadow-lg shadow-violet-500/25"
            >
              {submitted ? (
                "Suscrito"
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
