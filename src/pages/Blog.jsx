import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Search, BookOpen } from "lucide-react";
import { useBlogs } from "@/hooks/useBlogs";
import PageSEO from "@/components/seo/PageSEO";
import Footer from "@/components/common/Footer";
import { getCloudinaryUrl } from "@/utils/cloudinary";
import { BRAND_NAME } from "@/constants/brand";

const BLOG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": `Blog Oficial de ${BRAND_NAME} - Electrónica y Accesorios en Once`,
  "description": `Artículos, guías de compra, novedades y consejos sobre cargadores, auriculares y electrónica mayorista en Once, Buenos Aires.`,
  "publisher": {
    "@type": "Organization",
    "name": BRAND_NAME,
    "logo": {
      "@type": "ImageObject",
      "url": "https://nexastore.com.ar/brand/nexastore-logo.png"
    }
  }
};

export default function Blog() {
  const { blogs, loading, error } = useBlogs({ onlyPublished: true });
  const [selectedTag, setSelectedTag] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Extraer tags únicos de todos los blogs publicados
  const allTags = useMemo(() => {
    const tags = new Set();
    blogs.forEach((blog) => {
      if (Array.isArray(blog.tags)) {
        blog.tags.forEach((t) => tags.add(t.trim().toLowerCase()));
      }
    });
    return Array.from(tags);
  }, [blogs]);

  // Filtrar blogs por tag y búsqueda
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchTag = selectedTag === "all" || (blog.tags || []).map(t => t.toLowerCase()).includes(selectedTag);
      const matchQuery =
        !searchQuery.trim() ||
        `${blog.title || ""} ${blog.excerpt || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
      return matchTag && matchQuery;
    });
  }, [blogs, selectedTag, searchQuery]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="tk-theme-bg tk-theme-text min-h-screen pt-24 pb-12 flex flex-col justify-between">
      <PageSEO
        title="Blog de Electrónica y Accesorios en Once, Buenos Aires"
        description={`El blog oficial de ${BRAND_NAME} Once. Las mejores guías de cargadores, auriculares, accesorios de celulares y electrónica mayorista en Buenos Aires.`}
        canonical="/blog"
        jsonLd={BLOG_JSON_LD}
      />

      <div className="flex-1">
        {/* HERO SECTION DE BLOG */}
        <section className="relative overflow-hidden py-16 px-4 md:px-8 max-w-7xl mx-auto rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl mb-12">
          {/* Neon gradients inside hero */}
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] bg-blue-500/10 text-cyan-300 font-semibold border border-blue-500/20">
              <BookOpen className="w-3 h-3" />
              Novedades, Guías y Consejos
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              El Blog de <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">nexastore</span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              Descubrí las mejores guías técnicas, reviews de accesorios y consejos para comprar electrónica al mejor precio mayorista y minorista de todo Once, Buenos Aires.
            </p>

            {/* BARRA DE BÚSQUEDA */}
            <div className="relative max-w-lg mx-auto mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artículos..."
                className="w-full rounded-2xl border border-slate-700/60 bg-slate-950/40 pl-12 pr-4 py-3.5 text-sm outline-none text-white placeholder:text-slate-500 focus:border-cyan-400 transition"
              />
            </div>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL: FILTROS + GRID */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 mb-16">
          
          {/* FILTROS POR TAGS */}
          {!loading && allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center items-center py-2 border-b border-slate-800/40">
              <button
                onClick={() => setSelectedTag("all")}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] font-semibold transition ${
                  selectedTag === "all"
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md"
                    : "bg-slate-800/40 text-slate-300 border border-slate-700/40 hover:bg-slate-800/60"
                }`}
              >
                Todos
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] font-semibold transition ${
                    selectedTag === tag
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md"
                      : "bg-slate-800/40 text-slate-300 border border-slate-700/40 hover:bg-slate-800/60"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* GRID DE ARTÍCULOS */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400 border-r-2 border-transparent mr-2" />
              <span className="text-slate-400 text-sm uppercase tracking-widest">Cargando artículos...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">{error}</div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-24 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-base uppercase tracking-widest">No se encontraron artículos</p>
              <p className="text-xs text-slate-500">Prueba ajustando los filtros de etiquetas o la barra de búsqueda.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((blog, idx) => (
                <motion.article
                  key={blog.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-slate-900/35 border border-slate-800/50 hover:border-cyan-400/40 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-cyan-950/10 transition-all duration-300"
                >
                  {/* Contenedor Imagen */}
                  <Link to={`/blog/${blog.slug}`} className="relative block overflow-hidden aspect-[16/10] bg-slate-950 shrink-0">
                    {blog.coverImage ? (
                      <img
                        src={getCloudinaryUrl(blog.coverImage, { width: 600, quality: "auto" })}
                        alt={blog.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                  </Link>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Info y Tags */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 uppercase">
                          <User className="w-3.5 h-3.5" />
                          {blog.author || BRAND_NAME}
                        </span>
                      </div>

                      {/* Título */}
                      <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-tight">
                        <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                      </h2>

                      {/* Extracto */}
                      <p className="text-slate-400 text-sm font-light leading-relaxed line-clamp-3">
                        {blog.excerpt}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {blog.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedTag(tag.toLowerCase());
                              }}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800/60 border border-slate-700/60 text-cyan-400 hover:bg-slate-700/60 cursor-pointer transition"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Enlace Leer Más */}
                      <div className="border-t border-slate-800/40 pt-3">
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] font-semibold text-cyan-300 group-hover:text-cyan-200 transition"
                        >
                          Leer artículo
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
