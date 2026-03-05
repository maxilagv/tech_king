import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import Footer from "../components/common/Footer";
import {
  BRAND_ADDRESS,
  BRAND_GOOGLE_MAPS_EMBED_URL,
  BRAND_PHONE,
  BRAND_SUPPORT_EMAIL,
} from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

const contactInfo = [
  { icon: MapPin, label: "Direccion", value: BRAND_ADDRESS },
  { icon: Phone, label: "Telefono", value: BRAND_PHONE },
  { icon: Mail, label: "Email", value: BRAND_SUPPORT_EMAIL },
  { icon: Clock, label: "Horario", value: "Lunes a sabado 10:00 a 20:00" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const reduceMotion = useShouldReduceMotion();

  const handleSubmit = (event) => {
    event.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    window.setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="tk-theme-bg">
      <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24 tk-theme-soft relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            className="text-violet-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
          >
            Contacto
          </motion.span>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { delay: 0.1, duration: 0.6 }}
            className="tk-theme-text text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Necesitas
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent"> ayuda?</span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={reduceMotion ? undefined : { delay: 0.2 }}
            className="tk-theme-muted text-sm max-w-md mx-auto"
          >
            Nuestro equipo de soporte esta disponible para ayudarte con productos, garantias y pedidos.
          </motion.p>
        </div>
      </section>

      <section className="py-20 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
          <div className="lg:col-span-2 space-y-8">
            {contactInfo.map((item, index) => (
              <motion.div
                key={item.label}
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={reduceMotion ? undefined : { once: true }}
                transition={reduceMotion ? undefined : { delay: index * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/25">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-1">
                    {item.label}
                  </span>
                  <p className="tk-theme-text text-sm">{item.value}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reduceMotion ? undefined : { once: true }}
              className="aspect-[4/3] rounded-2xl overflow-hidden mt-8 border tk-theme-border tk-theme-surface"
            >
              <iframe
                title="Mapa NexaElectronics"
                src={BRAND_GOOGLE_MAPS_EMBED_URL}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 30 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={reduceMotion ? undefined : { once: true }}
            transition={reduceMotion ? undefined : { duration: 0.6 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Asunto</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
                  placeholder="Sobre que nos quieres hablar?"
                  required
                />
              </div>
              <div>
                <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Mensaje</label>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  rows={6}
                  className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 resize-none placeholder:text-[var(--tk-muted)]"
                  placeholder="Cuentanos con detalle"
                  required
                />
              </div>
              <motion.button
                type="submit"
                whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:from-violet-500 hover:to-fuchsia-400 transition-all duration-300 shadow-lg shadow-violet-500/25"
              >
                {sent ? (
                  "Mensaje enviado"
                ) : (
                  <>
                    Enviar mensaje
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
