import React from "react";
import HeroSection from "../components/home/HeroSection";
import OffersBanner from "../components/home/OffersBanner";
import FeaturedProducts from "../components/home/FeaturedProducts";
import CategoriesSection from "../components/home/CategoriesSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import NewsletterSection from "../components/home/NewsletterSection";
import Footer from "../components/common/Footer";

export default function Home() {
  return (
    <div className="tk-theme-bg tk-theme-text">
      <HeroSection />
      <OffersBanner />
      <FeaturedProducts />
      <CategoriesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
