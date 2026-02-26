import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowUpRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { getProductPricing } from "@/utils/offers";

export default function FeaturedProducts() {
  const { products, loading } = useProducts({ onlyActive: true, featuredOnly: true, limit: 4 });
  const { categories } = useCategories({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });

  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.slug || cat.id, cat.nombre])
  );

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 tk-theme-soft">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
            >
              Lo mas vendido
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
              className="tk-theme-text text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Productos
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                destacados
              </span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to={createPageUrl("Products")}
              className="tk-theme-muted text-sm tracking-[0.15em] uppercase hover:text-blue-500 transition-colors duration-500 mt-6 md:mt-0 inline-block"
            >
              Ver todo -&gt;
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm tk-theme-muted">
            Cargando destacados...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-sm tk-theme-muted">
            No hay productos destacados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((item, i) => {
              const pricing = getProductPricing(item, offers, 1);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                >
                  <Link to={`/products/${item.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-5 tk-theme-surface">
                      <img
                        src={
                          item.imagenes?.[0] ||
                          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=900&q=80"
                        }
                        alt={item.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-[#0A0A0A]/0 group-hover:bg-[#0A0A0A]/20 transition-all duration-500" />
                      {pricing.hasOffer && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 rounded-full bg-orange-500 text-[10px] tracking-[0.15em] uppercase text-white font-semibold shadow-lg">
                            -{pricing.discountPctApplied}%
                          </span>
                        </div>
                      )}
                      <motion.div
                        className="absolute top-4 right-4 w-10 h-10 rounded-full tk-theme-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        <ArrowUpRight className="w-4 h-4 tk-theme-text" />
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-blue-600 text-[11px] tracking-[0.25em] uppercase font-semibold">
                        {categoryMap[item.categorySlug] || item.categorySlug || "Tech"}
                      </span>
                      <h3 className="tk-theme-text text-lg font-medium leading-tight group-hover:text-blue-600 transition-colors duration-300">
                        {item.nombre}
                      </h3>
                      {pricing.hasOffer ? (
                        <div className="flex items-end gap-2">
                          <p className="tk-theme-text text-xl font-bold">
                            ${pricing.finalPrice.toFixed(2)}
                          </p>
                          <p className="text-sm tk-theme-muted line-through">
                            ${pricing.basePrice.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="tk-theme-text text-xl font-bold">
                          ${Number(item.precio || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
