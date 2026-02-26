import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import ProductFilters from "../components/products/ProductFilters";
import Footer from "../components/common/Footer";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const { categories } = useCategories({ onlyActive: true });
  const { products, loading } = useProducts({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });

  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  const offeredProductIds = useMemo(() => {
    const ids = new Set();
    for (const offer of offers) {
      for (const productId of offer.productIds || []) {
        ids.add(String(productId));
      }
    }
    return ids;
  }, [offers]);

  const filtered = useMemo(() => {
    if (activeCategory === "offers") {
      return products.filter((product) => offeredProductIds.has(String(product.id)));
    }
    if (activeCategory === "all") {
      return products;
    }
    return products.filter(
      (p) => p.category === activeCategory || p.categorySlug === activeCategory
    );
  }, [activeCategory, offeredProductIds, products]);

  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.slug || cat.id, cat.nombre])
  );

  const normalized = useMemo(
    () =>
      filtered.map((product) => ({
        ...product,
        categoryLabel: categoryMap[product.categorySlug] || product.categoryLabel,
      })),
    [filtered, categoryMap]
  );

  const hasActiveOffers = offers.length > 0;

  const handleCategoryChange = (nextCategory) => {
    setActiveCategory(nextCategory);
    if (nextCategory === "all") {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ category: nextCategory }, { replace: true });
  };

  return (
    <div className="tk-theme-bg">
      <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24 tk-theme-soft relative overflow-hidden">
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
            className="tk-theme-text text-4xl md:text-6xl font-bold tracking-tight mb-6"
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
            className="tk-theme-muted text-sm font-normal max-w-md mx-auto mb-10"
          >
            Tecnologia de ultima generacion con garantia oficial. Los mejores precios y envio
            gratis en compras mayores a $100.
          </motion.p>

          <ProductFilters
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            includeOffers={hasActiveOffers}
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
                <p className="tk-theme-muted text-sm">
                  {normalized.length} producto{normalized.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {normalized.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} offers={offers} />
                ))}
              </div>
              {normalized.length === 0 && (
                <div className="text-center py-20">
                  <p className="tk-theme-muted text-sm">
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
