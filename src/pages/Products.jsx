import React, { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../components/products/ProductCard";
import ProductFilters from "../components/products/ProductFilters";
import Footer from "../components/common/Footer";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { categories } = useCategories({ onlyActive: true });
  const { products, loading } = useProducts({ onlyActive: true });

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter(
          (p) => p.category === activeCategory || p.categorySlug === activeCategory
        );

  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.slug || cat.id, cat.nombre])
  );

  const normalized = filtered.map((product) => ({
    ...product,
    categoryLabel: categoryMap[product.categorySlug] || product.categoryLabel,
  }));

  return (
    <div className="bg-white">
      <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24 bg-[#F5F0EB] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C9A96E]/5 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
          >
            Catalogo completo
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[#0A0A0A] text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Productos{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              premium
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#0A0A0A]/60 text-sm font-normal max-w-md mx-auto mb-10"
          >
            Tecnologia de ultima generacion con garantia oficial. Los mejores precios y envio
            gratis en compras mayores a $100.
          </motion.p>

          <ProductFilters
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={categories}
          />
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-10">
                <p className="text-[#0A0A0A]/40 text-sm">
                  {normalized.length} producto{normalized.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {normalized.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              {normalized.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[#0A0A0A]/40 text-sm">
                    No hay productos en esta categoria.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
