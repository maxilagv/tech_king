import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import Footer from "../components/common/Footer";
import {
  buildContactWhatsAppMessage,
  createMailHref,
  createMapsHref,
  createPhoneHref,
  createWhatsAppUrl,
} from "@/utils/businessConfig";
import { useBusinessConfig } from "@/hooks/useBusinessConfig";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

export default function Contact() {
  const { businessConfig } = useBusinessConfig();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const reduceMotion = useShouldReduceMotion();
  const phoneHref = createPhoneHref(businessConfig);
  const mailHref = createMailHref(businessConfig);
  const mapsHref = createMapsHref(businessConfig);
  const generalWhatsAppHref = createWhatsAppUrl(
    businessConfig,
    "Hola, quiero recibir asesoramiento sobre productos y precios."
  );

  const contactInfo = [
    {
      icon: MapPin,
      label: "Direccion",
      value: businessConfig.address,
      href: mapsHref,
      external: true,
    },
    {
      icon: Phone,
      label: "Telefono",
      value: businessConfig.phoneDisplay,
      href: phoneHref,
    },
    {
      icon: Mail,
      label: "Email",
      value: businessConfig.supportEmail,
      href: mailHref,
    },
    { icon: Clock, label: "Horario", value: "Lunes a sabado 10:00 a 20:00" },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError("");
    const message = buildContactWhatsAppMessage(businessConfig, form);
    const whatsappHref = createWhatsAppUrl(businessConfig, message);
    if (!whatsappHref) {
      setSubmitError("No hay un numero de WhatsApp configurado.");
      return;
    }
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
    setSent(true);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    window.setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="tk-theme-bg">
      <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24 tk-theme-soft relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
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
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent"> ayuda?</span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={reduceMotion ? undefined : { delay: 0.2 }}
            className="tk-theme-muted text-sm max-w-md mx-auto"
          >
            Nuestro equipo te responde por WhatsApp y por email para ayudarte con productos, pedidos y garantia.
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
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-1">
                    {item.label}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="tk-theme-text text-sm hover:text-blue-600 transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="tk-theme-text text-sm">{item.value}</p>
                  )}
                </div>
              </motion.div>
            ))}

            <a
              href={generalWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25"
            >
              <MessageCircle className="w-4 h-4" />
              Hablar por WhatsApp
            </a>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reduceMotion ? undefined : { once: true }}
              className="aspect-[4/3] rounded-2xl overflow-hidden mt-8 border tk-theme-border tk-theme-surface"
            >
              <iframe
                title="Mapa Nexastore"
                src={businessConfig.mapsEmbedUrl}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
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
                    className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Telefono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
                    placeholder="+54 9 11..."
                  />
                </div>
              </div>
              <div>
                <label className="tk-theme-muted text-xs tracking-[0.15em] uppercase block mb-2">Asunto</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[var(--tk-muted)]"
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
                  className="w-full px-4 py-3.5 rounded-xl border tk-theme-border tk-theme-surface tk-theme-text text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none placeholder:text-[var(--tk-muted)]"
                  placeholder="Cuentanos con detalle"
                  required
                />
              </div>
              <p className="text-xs tk-theme-muted">
                Al enviar, abriremos WhatsApp con tu mensaje listo para que lo mandes al numero de soporte.
              </p>
              {submitError && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {submitError}
                </div>
              )}
              <motion.button
                type="submit"
                whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-sky-400 transition-all duration-300 shadow-lg shadow-blue-500/25"
              >
                {sent ? (
                  "WhatsApp listo"
                ) : (
                  <>
                    Enviar por WhatsApp
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
