import React from "react";
import HeroSection from "../components/home/HeroSection";
import OffersBanner from "../components/home/OffersBanner";
import FeaturedProducts from "../components/home/FeaturedProducts";
import TrustBadges from "../components/home/TrustBadges";
import CategoriesSection from "../components/home/CategoriesSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import NewsletterSection from "../components/home/NewsletterSection";
import Footer from "../components/common/Footer";
import BrandsSection from "../components/home/BrandsSection";
import WhyNexa from "../components/home/WhyNexa";
import FlashDeals from "../components/home/FlashDeals";
import PageSEO from "@/components/seo/PageSEO";

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Donde queda Nexastore en Once?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nexastore esta ubicado en Av. Corrientes 2332, Once, Buenos Aires. Atendemos de lunes a viernes de 09:00 a 18:30 y sábados de 09:00 a 17:00.",
      },
    },
    {
      "@type": "Question",
      name: "Nexastore hace envios a todo Argentina?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Si, realizamos envios a todo el territorio argentino. Consulta costos y tiempos de entrega por WhatsApp.",
      },
    },
    {
      "@type": "Question",
      name: "Que productos vende Nexastore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vendemos cargadores para celulares, auriculares bluetooth, accesorios para smartphones, cables USB, y electronica en general. Contamos con precios mayoristas y minoristas.",
      },
    },
    {
      "@type": "Question",
      name: "Nexastore vende al por mayor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Si, ofrecemos precios mayoristas en cargadores, auriculares y accesorios. Contactanos por WhatsApp para consultar precios por volumen.",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="tk-theme-bg tk-theme-text">
      <PageSEO
        title="Cargadores y Electronica en Once, Buenos Aires"
        description="Nexastore Once - Cargadores, auriculares, accesorios y electronica al mejor precio. Local en Av. Corrientes 2332, Once, Buenos Aires. Envios a todo Argentina."
        canonical="/"
        jsonLd={HOME_JSON_LD}
      />
      <HeroSection />
      <TrustBadges />
      <OffersBanner />
      <FlashDeals />
      <FeaturedProducts />
      <BrandsSection />
      <WhyNexa />
      <CategoriesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
