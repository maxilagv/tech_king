import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/api/firebase";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const reduceMotion = useShouldReduceMotion();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "newsletter"), {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });
    } catch {
      // Do not block the conversion path if the newsletter write fails.
    } finally {
      setSaving(false);
      setSubmitted(true);
      setEmail("");
      window.setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="tk-landing-band relative overflow-hidden py-20 md:py-28 tk-theme-soft">
      <div className="tk-section-shell relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
          transition={reduceMotion ? undefined : { duration: 0.55 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="tk-kicker mb-4 block">Newsletter</span>
          <h2 className="tk-heading mb-4 text-3xl md:text-5xl">
            Recibe ofertas <span className="text-blue-600">exclusivas</span>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed tk-theme-muted md:text-base">
            Lanzamientos, descuentos especiales y novedades de tecnologia en tu correo.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto grid max-w-lg gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Tu correo electronico"
              className="tk-focus-glow min-h-12 rounded-lg border border-[var(--tk-border)] bg-[var(--tk-surface)] px-5 text-sm text-[var(--tk-text)] outline-none placeholder:text-[var(--tk-muted)]"
            />
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="tk-shine inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_18px_50px_rgba(37,99,235,0.24)] transition-colors duration-300 hover:bg-blue-700 disabled:opacity-60"
            >
              <span className="relative z-[2] inline-flex items-center gap-2">
                {submitted ? (
                  <>
                    <Check className="h-3.5 w-3.5 animate-tk-check-pop" />
                    Suscrito
                  </>
                ) : (
                  <>
                    {saving ? "Guardando..." : "Suscribirse"}
                    {!saving && <Send className="h-3.5 w-3.5" />}
                  </>
                )}
              </span>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
