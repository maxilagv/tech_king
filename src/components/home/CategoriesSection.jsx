import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCategories } from "@/hooks/useCategories";

export default function CategoriesSection() {
  const { categories, loading } = useCategories({ onlyActive: true });

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 tk-theme-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold">
            Categorias
          </span>
          <h2 className="tk-theme-text text-4xl md:text-5xl font-bold tracking-tight">
            Explora por{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              categoria
            </span>
          </h2>
        </motion.div>

        {loading ? (
          <div className="py-16 text-center text-sm tk-theme-muted">
            Cargando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-sm tk-theme-muted">
            No hay categorias cargadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
              >
                <Link
                  to={createPageUrl("Products")}
                  className="group relative block aspect-[4/5] rounded-3xl overflow-hidden"
                >
                  <img
                    src={cat.imagen}
                    alt={cat.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-white/50 text-xs tracking-[0.2em] uppercase block mb-2">
                          {cat.productos || "-"} productos
                        </span>
                        <h3 className="text-white text-3xl md:text-4xl font-extralight tracking-tight">
                          {cat.nombre}
                        </h3>
                        {cat.descripcion && (
                          <p className="text-white/60 text-sm mt-1 font-light">
                            {cat.descripcion}
                          </p>
                        )}
                      </div>
                      <motion.div
                        className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-all duration-500"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="text-white text-xl font-light">-&gt;</span>
                      </motion.div>
                    </div>
                  </div>

                  <div className="absolute top-6 left-6">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] tracking-[0.2em] uppercase border border-white/10">
                      {cat.nombre}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
