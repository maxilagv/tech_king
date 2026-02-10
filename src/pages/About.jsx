import React from "react";
import { motion } from "framer-motion";
import { Award, Leaf, Heart, Truck } from "lucide-react";
import Footer from "../components/common/Footer";

const values = [
  { icon: Award, title: "Calidad", desc: "Solo trabajamos con marcas reconocidas y productos con garantía oficial del fabricante." },
  { icon: Leaf, title: "Sostenibilidad", desc: "Promovemos productos eco-friendly y programas de reciclaje de dispositivos electrónicos." },
  { icon: Heart, title: "Soporte 24/7", desc: "Nuestro equipo técnico está disponible las 24 horas para resolver cualquier duda o problema." },
  { icon: Truck, title: "Envío rápido", desc: "Entrega express en 24-48h con embalaje seguro que protege tu compra hasta la puerta de tu casa." },
];

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&q=80"
          alt="About"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-blue-900/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-cyan-400 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
            >
              Nuestra historia
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              Innovación y<br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">tecnología</span>
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
              Desde 2020
            </span>
            <h2 className="text-[#0A0A0A] text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Tecnología al alcance de <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">todos</span>
            </h2>
            <div className="space-y-4 text-[#0A0A0A]/70 text-sm font-normal leading-relaxed">
              <p>
                Tech King comenzó con una visión clara: democratizar el acceso a tecnología
                de alta gama. Trabajamos directamente con los principales fabricantes para
                ofrecer los mejores precios sin comprometer la calidad.
              </p>
              <p>
                Cada producto en nuestro catálogo cuenta con garantía oficial del fabricante.
                Nuestro equipo de expertos tech prueba y valida cada artículo antes de
                agregarlo a nuestra tienda.
              </p>
              <p>
                Creemos que la tecnología debe ser accesible, confiable y respaldada por
                un servicio al cliente excepcional. Por eso ofrecemos soporte técnico 24/7
                y garantía extendida en todos nuestros productos.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80"
                alt="Our story"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 rounded-2xl shadow-2xl shadow-blue-500/40">
              <span className="text-3xl font-bold text-white">5000+</span>
              <p className="text-xs text-white/80 tracking-wide uppercase mt-1 font-medium">Productos disponibles</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#F5F0EB]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
              Valores
            </span>
            <h2 className="text-[#0A0A0A] text-3xl md:text-4xl font-bold tracking-tight">
              Lo que nos <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">define</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white p-8 rounded-2xl hover:shadow-xl hover:shadow-blue-500/10 hover:border hover:border-blue-100 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
                  <v.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[#0A0A0A] text-base font-semibold mb-2">{v.title}</h3>
                <p className="text-[#0A0A0A]/60 text-sm font-normal leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
