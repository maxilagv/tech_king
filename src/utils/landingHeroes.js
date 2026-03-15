function safeString(value) {
  return String(value || "").trim();
}

export function resolveLandingHeroDesktopImage(slide) {
  return safeString(slide?.imagenDesktop || slide?.imagen);
}

export function resolveLandingHeroMobileImage(slide) {
  return safeString(slide?.imagenMobile || slide?.imagenDesktop || slide?.imagen);
}

export function normalizeLandingHeroSlide(slide, index = 0) {
  const imagenDesktop = resolveLandingHeroDesktopImage(slide);
  const imagenMobile = resolveLandingHeroMobileImage(slide);

  return {
    id: slide?.id || `slide-${index}`,
    titulo: safeString(slide?.titulo),
    subtitulo: safeString(slide?.subtitulo),
    descripcion: safeString(slide?.descripcion),
    badge: safeString(slide?.badge),
    ctaLabel: safeString(slide?.ctaLabel || "Ver catalogo"),
    ctaUrl: safeString(slide?.ctaUrl || "/products"),
    imagen: imagenDesktop,
    imagenDesktop,
    imagenMobile: imagenMobile || imagenDesktop,
    orden: Number(slide?.orden || index),
    activo: slide?.activo !== false,
  };
}
