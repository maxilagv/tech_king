import React, { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import ProductFilters from "../components/products/ProductFilters";
import Footer from "../components/common/Footer";
import { Search } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { getProductPricing } from "@/utils/offers";
import PageSEO from "@/components/seo/PageSEO";
import { BRAND_URL } from "@/constants/brand";

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildSearchableText(product, categoryLabel) {
  return [
    product.nombre,
    product.name,
    product.marca,
    product.brand,
    product.category,
    product.categorySlug,
    product.categoryId,
    categoryLabel,
    product.descripcion,
    product.description,
    product.sku,
    product.codigo,
    product.modelo,
  ]
    .map((field) => normalizeSearchText(field))
    .filter(Boolean)
    .join(" ");
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategoryParam = searchParams.get("category");
  const activeCategory = rawCategoryParam ? rawCategoryParam : "all";
  const queryParam = searchParams.get("q") || "";
  const normalizedQuery = normalizeSearchText(queryParam);
  const sortOrder = searchParams.get("sort") || "default";
  const priceMin = searchParams.get("priceMin") || "";
  const priceMax = searchParams.get("priceMax") || "";

  const { categories } = useCategories({ onlyActive: true });
  const { products, loading } = useProducts({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });
  const reduceMotion = useShouldReduceMotion();

  const offeredProductIds = useMemo(() => {
    const ids = new Set();
    for (const offer of offers) {
      for (const productId of offer.productIds || []) {
        ids.add(String(productId));
      }
    }
    return ids;
  }, [offers]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((cat) => [cat.slug || cat.id, cat.nombre])),
    [categories]
  );

  const activeCategoryAliases = useMemo(() => {
    if (activeCategory === "all" || activeCategory === "offers") {
      return new Set();
    }

    const aliases = new Set([normalizeSearchText(activeCategory)]);
    const matchedCategory = categories.find(
      (cat) => String(cat.slug || "") === activeCategory || String(cat.id) === activeCategory
    );

    if (matchedCategory) {
      aliases.add(normalizeSearchText(matchedCategory.slug));
      aliases.add(normalizeSearchText(matchedCategory.id));
      aliases.add(normalizeSearchText(matchedCategory.nombre));
    }

    return aliases;
  }, [activeCategory, categories]);

  const filtered = useMemo(() => {
    let byCategory = products;

    if (activeCategory === "offers") {
      byCategory = products.filter((product) => offeredProductIds.has(String(product.id)));
    } else if (activeCategory !== "all") {
      byCategory = products.filter((product) => {
        const productCategoryValues = [
          product.category,
          product.categorySlug,
          product.categoryId,
          product.categoryLabel,
        ]
          .map((value) => normalizeSearchText(value))
          .filter(Boolean);

        return productCategoryValues.some((value) => activeCategoryAliases.has(value));
      });
    }

    if (normalizedQuery) {
      byCategory = byCategory.filter((product) => {
        const categoryLabel =
          categoryMap[product.categorySlug] ||
          categoryMap[product.categoryId] ||
          product.categoryLabel ||
          "";
        const haystack = buildSearchableText(product, categoryLabel);
        return haystack.includes(normalizedQuery);
      });
    }

    return byCategory;
  }, [activeCategory, activeCategoryAliases, categoryMap, normalizedQuery, offeredProductIds, products]);

  const normalized = useMemo(() => {
    let list = filtered.map((product) => ({
      ...product,
      categoryLabel:
        categoryMap[product.categorySlug] ||
        categoryMap[product.categoryId] ||
        product.categoryLabel,
    }));

    // ── Price range filter ──
    const min = priceMin !== "" ? Number(priceMin) : null;
    const max = priceMax !== "" ? Number(priceMax) : null;
    if (min !== null || max !== null) {
      list = list.filter((product) => {
        const pricing = getProductPricing(product, offers, 1);
        const price = pricing.finalPrice;
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }

    // ── Sort ──
    if (sortOrder === "az") {
      list = [...list].sort((a, b) =>
        (a.nombre || a.name || "").localeCompare(b.nombre || b.name || "", "es", { sensitivity: "base" })
      );
    } else if (sortOrder === "za") {
      list = [...list].sort((a, b) =>
        (b.nombre || b.name || "").localeCompare(a.nombre || a.name || "", "es", { sensitivity: "base" })
      );
    } else if (sortOrder === "price_asc") {
      list = [...list].sort((a, b) => {
        const pa = getProductPricing(a, offers, 1).finalPrice;
        const pb = getProductPricing(b, offers, 1).finalPrice;
        return pa - pb;
      });
    } else if (sortOrder === "price_desc") {
      list = [...list].sort((a, b) => {
        const pa = getProductPricing(a, offers, 1).finalPrice;
        const pb = getProductPricing(b, offers, 1).finalPrice;
        return pb - pa;
      });
    }

    return list;
  }, [filtered, categoryMap, sortOrder, priceMin, priceMax, offers]);

  const hasActiveOffers = offers.length > 0;

  const handleCategoryChange = (nextCategory) => {
    const nextParams = new URLSearchParams(searchParams);
    const sanitizedQuery = normalizeSearchText(nextParams.get("q"));
    if (!sanitizedQuery) nextParams.delete("q");

    if (nextCategory === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", nextCategory);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleSortChange = (nextSort) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextSort === "default") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", nextSort);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handlePriceChange = (min, max) => {
    const nextParams = new URLSearchParams(searchParams);
    if (min === "" || min == null) {
      nextParams.delete("priceMin");
    } else {
      nextParams.set("priceMin", min);
    }
    if (max === "" || max == null) {
      nextParams.delete("priceMax");
    } else {
      nextParams.set("priceMax", max);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const containerRef = useRef(null);

  useGSAP(() => {
    if (reduceMotion) return;

    gsap.set(".products-hero", { opacity: 0, y: 30 });
    gsap.to(".products-hero", {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power4.out"
    });
  }, { scope: containerRef, dependencies: [reduceMotion] });

  useGSAP(() => {
    if (reduceMotion || normalized.length === 0) return;

    gsap.set(".product-card", { opacity: 0 });
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      ScrollTrigger.batch(".product-card", {
        start: "top 85%",
        onEnter: (elements) => {
          gsap.fromTo(elements, 
            { opacity: 0, y: 50, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.8, ease: "power4.out", overwrite: true }
          );
        },
        once: true
      });
    });

    mm.add("(max-width: 767px)", () => {
      ScrollTrigger.batch(".product-card", {
        start: "top 90%",
        onEnter: (elements) => {
          gsap.fromTo(elements, 
            { opacity: 0, y: 20, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.05, duration: 0.5, ease: "power3.out", overwrite: true }
          );
        },
        once: true
      });
    });

    return () => mm.revert();
  }, { scope: containerRef, dependencies: [reduceMotion, normalized] });

  return (
    <div ref={containerRef} className="tk-theme-bg">
      <PageSEO
        title="Catálogo de Productos — Cargadores, Auriculares y Electrónica"
        description="Explorá el catálogo completo de Nexastore. Cargadores, auriculares bluetooth, accesorios para celular y electrónica. Precios mayoristas y minoristas. Envíos a todo Argentina."
        canonical="/products"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: `${BRAND_URL}/` },
            { "@type": "ListItem", position: 2, name: "Productos", item: `${BRAND_URL}/products` },
          ],
        }}
      />
      <section className="pt-32 pb-16 px-6 md:px-16 lg:px-24 tk-theme-soft relative overflow-visible">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span
            className="products-hero text-blue-600 text-xs tracking-[0.3em] uppercase mb-4 block font-semibold"
          >
            Catalogo completo
          </span>
          <h1
            className="products-hero tk-theme-text text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Productos{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              premium
            </span>
          </h1>
          <p
            className="products-hero tk-theme-muted text-sm font-normal max-w-md mx-auto mb-10"
          >
            Tecnologia de ultima generacion con garantia oficial. Los mejores precios y envios
            gratis a partir de 200.000 ARS.
          </p>

          <ProductFilters
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            includeOffers={hasActiveOffers}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            priceMin={priceMin}
            priceMax={priceMax}
            onPriceChange={handlePriceChange}
          />
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-2xl bg-blue-100 dark:bg-blue-900/20 mb-4" />
                  <div className="h-3 rounded bg-blue-100 dark:bg-blue-900/20 w-2/3 mb-2" />
                  <div className="h-4 rounded bg-blue-100 dark:bg-blue-900/20 w-full mb-2" />
                  <div className="h-4 rounded bg-blue-100 dark:bg-blue-900/20 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-10">
                <p className="tk-theme-muted text-sm">
                  {normalized.length} producto{normalized.length !== 1 ? "s" : ""}
                </p>
                {queryParam.trim() && (
                  <p className="tk-theme-muted text-xs uppercase tracking-[0.15em]">
                    Busqueda: "{queryParam.trim()}"
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {normalized.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} offers={offers} />
                ))}
              </div>
              {normalized.length === 0 && (
                <div className="text-center py-24 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Search className="w-8 h-8 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-semibold tk-theme-text">Sin resultados</h3>
                  <p className="text-sm tk-theme-muted max-w-xs">
                    {queryParam
                      ? `No encontramos productos para "${queryParam}". Probá con otro término.`
                      : "No hay productos en esta categoría o rango de precio."}
                  </p>
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="mt-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-blue-700 transition"
                  >
                    Ver todos los productos
                  </button>
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
