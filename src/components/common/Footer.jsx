import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white pt-20 pb-8 px-6 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              Tech King
            </h3>
            <p className="text-white/50 text-sm font-normal leading-relaxed max-w-sm">
              Tu tienda de confianza para productos electrónicos y electrodomésticos.
              Calidad garantizada y los mejores precios del mercado.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/60 mb-6">
              Navegación
            </h4>
            <ul className="space-y-3">
              {["Home", "Products", "About", "Contact"].map((page) => (
                <li key={page}>
                  <Link
                    to={createPageUrl(page)}
                    className="text-white/40 text-sm hover:text-[#C9A96E] transition-colors duration-300"
                  >
                    {page === "Home" ? "Inicio" : page === "Products" ? "Productos" : page === "About" ? "Nosotros" : "Contacto"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/60 mb-6">
              Contacto
            </h4>
            <ul className="space-y-3 text-white/40 text-sm">
              <li>soporte@techking.com</li>
              <li>+1 (800) 123-4567</li>
              <li>Tech Plaza, Suite 200<br />San Francisco, CA</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-xs tracking-[0.1em]">
          <span>© 2026 Tech King. Todos los derechos reservados.</span>
          <div className="flex gap-6">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Garantía</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
