import React from "react";
import HeroSection from "../components/home/HeroSection";
import OffersBanner from "../components/home/OffersBanner";
import FeaturedProducts from "../components/home/FeaturedProducts";
import TrustBadges from "../components/home/TrustBadges";
import CategoriesSection from "../components/home/CategoriesSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import NewsletterSection from "../components/home/NewsletterSection";
import Footer from "../components/common/Footer";
import PageSEO from "@/components/seo/PageSEO";

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Dónde queda Nexastore en Once?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nexastore está ubicado en Av. Corrientes 2332, Once, Buenos Aires. Atendemos de lunes a sábado de 10:00 a 20:00.",
      },
    },
    {
      "@type": "Question",
      name: "¿Nexastore hace envíos a todo Argentina?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, realizamos envíos a todo el territorio argentino. Consulta costos y tiempos de entrega por WhatsApp.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué productos vende Nexastore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vendemos cargadores para celulares, auriculares bluetooth, accesorios para smartphones, cables USB, y electrónica en general. Contamos con precios mayoristas y minoristas.",
      },
    },
    {
      "@type": "Question",
      name: "¿Nexastore vende al por mayor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, ofrecemos precios mayoristas en cargadores, auriculares y accesorios. Contactanos por WhatsApp para consultar precios por volumen.",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="tk-theme-bg tk-theme-text">
      <PageSEO
        title="Cargadores y Electrónica en Once, Buenos Aires"
        description="Nexastore Once — Cargadores, auriculares, accesorios y electrónica al mejor precio. Local en Av. Corrientes 2332, Once, Buenos Aires. Envíos a todo Argentina."
        canonical="/"
        jsonLd={HOME_JSON_LD}
      />
      <HeroSection />
      <OffersBanner />
      <FeaturedProducts />
      <TrustBadges />
      <CategoriesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
