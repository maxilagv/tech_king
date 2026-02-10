import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import Footer from "../components/common/Footer";

const contactInfo = [
  { icon: MapPin, label: "Dirección", value: "Tech Plaza, Suite 200, San Francisco, CA" },
  { icon: Phone, label: "Teléfono", value: "+1 (800) 123-4567" },
  { icon: Mail, label: "Email", value: "soporte@electrostore.com" },
  { icon: Clock, label: "Horario", value: "24/7 Soporte en línea" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24 bg-[#F5F0EB] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#C9A96E]/5 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
          >
            Contacto
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[#0A0A0A] text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            ¿Necesitas <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">ayuda?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#0A0A0A]/60 text-sm font-normal max-w-md mx-auto"
          >
            Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier 
            consulta sobre productos, garantías o problemas técnicos.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-8">
            {contactInfo.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[#0A0A0A]/40 text-xs tracking-[0.15em] uppercase block mb-1">
                    {item.label}
                  </span>
                  <p className="text-[#0A0A0A] text-sm font-light">{item.value}</p>
                </div>
              </motion.div>
            ))}

            {/* Map placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="aspect-[4/3] rounded-2xl overflow-hidden mt-8 border-2 border-blue-100"
            >
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
                alt="Location"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[#0A0A0A]/40 text-xs tracking-[0.15em] uppercase block mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#0A0A0A]/10 text-[#0A0A0A] text-sm bg-transparent focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[#0A0A0A]/30"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#0A0A0A]/40 text-xs tracking-[0.15em] uppercase block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#0A0A0A]/10 text-[#0A0A0A] text-sm bg-transparent focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[#0A0A0A]/30"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[#0A0A0A]/40 text-xs tracking-[0.15em] uppercase block mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-[#0A0A0A]/10 text-[#0A0A0A] text-sm bg-transparent focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-[#0A0A0A]/30"
                  placeholder="¿Sobre qué nos quieres hablar?"
                  required
                />
              </div>
              <div>
                <label className="text-[#0A0A0A]/40 text-xs tracking-[0.15em] uppercase block mb-2">
                  Mensaje
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3.5 rounded-xl border border-[#0A0A0A]/10 text-[#0A0A0A] text-sm bg-transparent focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none placeholder:text-[#0A0A0A]/30"
                  placeholder="Cuéntanos con detalle..."
                  required
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:from-blue-500 hover:to-blue-400 transition-all duration-500 shadow-lg shadow-blue-500/30"
              >
                {sent ? (
                  "¡Mensaje enviado! ✓"
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
