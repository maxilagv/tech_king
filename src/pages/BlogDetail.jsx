import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Share2, Tag, BookOpen } from "lucide-react";
import { db } from "@/api/firebase";
import PageSEO from "@/components/seo/PageSEO";
import Footer from "@/components/common/Footer";
import { getCloudinaryUrl } from "@/utils/cloudinary";
import { BRAND_NAME, BRAND_URL } from "@/constants/brand";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    const fetchBlogPost = async () => {
      setLoading(true);
      setError("");
      try {
        const blogsRef = collection(db, "blogs");
        const q = query(blogsRef, where("slug", "==", slug), where("published", "==", true), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("El artículo que buscas no existe o ya no se encuentra disponible.");
          setPost(null);
          setLoading(false);
          return;
        }

        const docData = querySnapshot.docs[0].data();
        const postObj = { id: querySnapshot.docs[0].id, ...docData };
        setPost(postObj);
        setLoading(false);

        // Fetch related posts (latest posts excluding the current one)
        const relatedQuery = query(blogsRef, where("published", "==", true), limit(4));
        const relatedSnapshot = await getDocs(relatedQuery);
        const related = relatedSnapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((p) => p.slug !== slug)
          .slice(0, 3);
        setRelatedPosts(related);

      } catch (err) {
        setError("Error al cargar el artículo. Por favor, intenta de nuevo.");
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  // Estimar tiempo de lectura
  const readingTime = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) return 1;
    let wordCount = 0;
    blocks.forEach((block) => {
      if (block.type === "paragraph" || block.type === "heading2" || block.type === "heading3") {
        wordCount += (block.text || "").split(/\s+/).length;
      } else if (block.type === "list" && Array.isArray(block.items)) {
        block.items.forEach((item) => {
          wordCount += (item || "").split(/\s+/).length;
        });
      }
    });
    const minutes = Math.ceil(wordCount / 220); // promedio de 220 palabras por minuto
    return minutes || 1;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Construir marcado JSON-LD estructurado de Artículo para Google
  const buildArticleJsonLd = (article) => {
    if (!article) return null;
    
    // Concatenar todos los bloques de texto para alimentar la araña de Google
    let bodyText = "";
    if (Array.isArray(article.contentBlocks)) {
      article.contentBlocks.forEach((block) => {
        if (block.type === "paragraph" || block.type === "heading2" || block.type === "heading3") {
          bodyText += ` ${block.text || ""}`;
        } else if (block.type === "list" && Array.isArray(block.items)) {
          bodyText += ` ${block.items.join(". ")}`;
        }
      });
    }

    const pubDate = article.publishedAt
      ? (article.publishedAt.toDate ? article.publishedAt.toDate() : new Date(article.publishedAt.seconds * 1000))
      : new Date();

    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt || article.metaDescription,
      "image": [article.coverImage],
      "datePublished": pubDate.toISOString(),
      "dateModified": pubDate.toISOString(),
      "author": [{
        "@type": "Organization",
        "name": article.author || BRAND_NAME,
        "url": BRAND_URL
      }],
      "publisher": {
        "@type": "Organization",
        "name": BRAND_NAME,
        "logo": {
          "@type": "ImageObject",
          "url": "https://nexastore.com.ar/brand/nexastore-logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${BRAND_URL}/blog/${article.slug}`
      },
      "articleBody": bodyText.trim()
    };
  };

  return (
    <div className="tk-theme-bg tk-theme-text min-h-screen pt-24 pb-12 flex flex-col justify-between">
      {post && (
        <PageSEO
          title={post.metaTitle || post.title}
          description={post.metaDescription || post.excerpt}
          canonical={`/blog/${post.slug}`}
          image={post.coverImage}
          type="article"
          jsonLd={buildArticleJsonLd(post)}
        />
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* BOTÓN VOLVER (Adaptado a temas) */}
        <div className="mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] font-semibold tk-theme-muted hover:tk-theme-text transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Blog
          </Link>
        </div>

        {loading ? (
          <div className="py-32 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 dark:border-cyan-400 border-r-2 border-transparent mr-2" />
            <span className="tk-theme-muted text-sm uppercase tracking-widest">Cargando artículo...</span>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-4">
            <BookOpen className="w-16 h-16 tk-theme-muted mx-auto opacity-50" />
            <h2 className="text-2xl font-bold tk-theme-text">Artículo No Encontrado</h2>
            <p className="tk-theme-muted max-w-md mx-auto text-sm">{error}</p>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-500 text-white dark:text-slate-950 px-6 py-2.5 text-xs font-bold tracking-[0.15em] uppercase hover:opacity-90 transition"
            >
              Ir a listado del blog
            </Link>
          </div>
        ) : (
          /* ──── CUERPO DEL POST ──── */
          <article className="space-y-8">
            {/* Meta y Título */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs tk-theme-muted uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  {post.author || BRAND_NAME}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  Lectura {readingTime(post.contentBlocks)} min
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight tk-theme-text leading-tight">
                {post.title}
              </h1>

              <p className="text-base sm:text-xl tk-theme-text leading-relaxed font-light border-l-4 border-blue-600 dark:border-cyan-400 pl-4 py-1.5 bg-[var(--tk-soft)] rounded-r-2xl pr-4">
                {post.excerpt}
              </p>
            </div>

            {/* Portada e Imagen */}
            {post.coverImage && (
              <div className="relative rounded-3xl overflow-hidden aspect-[21/10] bg-[var(--tk-soft)] border tk-theme-border shadow-2xl">
                <img
                  src={getCloudinaryUrl(post.coverImage, { width: 1000, quality: "auto" })}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* BOTÓN COMPARTIR Y TAGS */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y tk-theme-border py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                {post.tags && post.tags.length > 0 ? (
                  post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-xs bg-[var(--tk-field-bg)] border tk-theme-border text-blue-600 dark:text-cyan-300 font-medium"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs tk-theme-muted">Sin etiquetas</span>
                )}
              </div>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--tk-soft)] hover:bg-[var(--tk-field-bg)] border tk-theme-border text-xs font-semibold tk-theme-text transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedShare ? "¡Copiado al Portapapeles!" : "Compartir Artículo"}
              </button>
            </div>

            {/* CONTENIDO SEMÁNTICO RENDERIZADO POR BLOQUES */}
            <div className="space-y-6 tk-theme-text font-sans leading-relaxed text-base sm:text-lg">
              {(post.contentBlocks || []).map((block, idx) => {
                if (block.type === "paragraph") {
                  return (
                    <p key={idx} className="whitespace-pre-wrap font-light tk-theme-text leading-relaxed mb-6">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === "heading2") {
                  return (
                    <h2
                      key={idx}
                      className="text-2xl sm:text-3xl font-bold tk-theme-text tracking-tight mt-10 mb-4 border-b tk-theme-border pb-3"
                    >
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "heading3") {
                  return (
                    <h3 key={idx} className="text-xl sm:text-2xl font-semibold text-blue-600 dark:text-cyan-100 tracking-tight mt-8 mb-3">
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "image") {
                  return (
                    <figure key={idx} className="space-y-2 mt-6 mb-8 text-center">
                      {block.url && (
                        <div className="rounded-2xl overflow-hidden border tk-theme-border shadow-xl max-h-[500px]">
                          <img
                            src={getCloudinaryUrl(block.url, { width: 800, quality: "auto" })}
                            alt={block.caption || post.title}
                            loading="lazy"
                            className="w-full h-full object-cover mx-auto"
                          />
                        </div>
                      )}
                      {block.caption && (
                        <figcaption className="text-xs sm:text-sm tk-theme-muted italic font-light">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={idx} className="list-disc pl-6 space-y-2.5 mb-6 tk-theme-text font-light">
                      {(block.items || []).map((li, i) => (
                        <li key={i} className="pl-1">
                          {li}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return null;
              })}
            </div>

            {/* ARTÍCULOS RELACIONADOS / INTERNAL LINKING */}
            {relatedPosts.length > 0 && (
              <div className="border-t tk-theme-border pt-10 mt-16 space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tk-theme-text">Artículos Recomendados</h3>
                  <p className="text-xs sm:text-sm tk-theme-muted mt-1">Seguí leyendo más novedades sobre electrónica en Once.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      to={`/blog/${related.slug}`}
                      className="group block p-4 rounded-2xl tk-theme-surface border tk-theme-border hover:border-blue-500 dark:hover:border-cyan-400/30 hover:bg-[var(--tk-soft)] transition-all duration-300"
                    >
                      <div className="aspect-[16/10] bg-[var(--tk-soft)] rounded-xl overflow-hidden border tk-theme-border mb-3 shrink-0">
                        {related.coverImage ? (
                          <img
                            src={getCloudinaryUrl(related.coverImage, { width: 300, quality: "auto" })}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center tk-theme-muted">
                            <BookOpen className="w-6 h-6 opacity-40" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold tk-theme-text group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-tight">
                        {related.title}
                      </h4>
                      <p className="text-[11px] text-blue-600 dark:text-cyan-300 mt-1.5 flex items-center gap-1 uppercase tracking-wider font-semibold">
                        Ver artículo <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </div>

      <Footer />
    </div>
  );
}
