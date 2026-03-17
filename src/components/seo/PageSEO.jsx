import React from "react";
import { Helmet } from "react-helmet-async";
import { BRAND_NAME, BRAND_URL } from "@/constants/brand";

const DEFAULT_IMAGE =
  "https://i.postimg.cc/HxK9cS11/Chat-GPT-Image-5-mar-2026-12-07-28-p-m.png";

/**
 * Componente SEO reutilizable para todas las páginas públicas.
 * Maneja title, description, canonical, Open Graph y Twitter Cards.
 *
 * @param {string}  title       - Título de la página (sin sufijo de marca, se agrega automáticamente)
 * @param {string}  description - Meta description (150–160 caracteres ideal)
 * @param {string}  canonical   - URL canónica de la página (relativa, ej: "/products")
 * @param {string}  image       - URL absoluta de la imagen OG
 * @param {string}  type        - OG type ("website" | "article" | "product")
 * @param {object}  jsonLd      - Objeto JSON-LD adicional para structured data
 */
export default function PageSEO({
  title,
  description,
  canonical = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd = null,
}) {
  const fullTitle = title
    ? `${title} | ${BRAND_NAME}`
    : `${BRAND_NAME} | Cargadores y Electrónica en Once, Buenos Aires`;

  const canonicalUrl = `${BRAND_URL}${canonical}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="es_AR" />
      <meta property="og:site_name" content={BRAND_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD adicional si se pasa */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
