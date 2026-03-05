import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BRAND_ADDRESS,
  BRAND_NAME,
  BRAND_PHONE,
  BRAND_SUPPORT_EMAIL,
} from "@/constants/brand";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0f0829] text-white pt-20 pb-8 px-6 md:px-16 lg:px-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-8%] w-[460px] h-[460px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[-12%] w-[520px] h-[520px] rounded-full bg-violet-500/20 blur-[170px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold tracking-tight mb-4">{BRAND_NAME}</h3>
            <p className="text-white/70 text-sm font-normal leading-relaxed max-w-md">
              Tecnologia premium con atencion personalizada, garantia real y soporte postventa.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/60 mb-6">Navegacion</h4>
            <ul className="space-y-3">
              {["Home", "Products", "About", "Contact"].map((page) => (
                <li key={page}>
                  <Link
                    to={createPageUrl(page)}
                    className="text-white/60 text-sm hover:text-violet-200 transition-colors duration-300"
                  >
                    {page === "Home"
                      ? "Inicio"
                      : page === "Products"
                        ? "Productos"
                        : page === "About"
                          ? "Nosotros"
                          : "Contacto"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/60 mb-6">Contacto</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              <li>{BRAND_SUPPORT_EMAIL}</li>
              <li>{BRAND_PHONE}</li>
              <li>{BRAND_ADDRESS}</li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-white/[0.08] mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-xs tracking-[0.1em]">
          <span>© 2026 {BRAND_NAME}. Todos los derechos reservados.</span>
          <div className="flex gap-6">
            <span className="hover:text-violet-200 cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-violet-200 cursor-pointer transition-colors">Terminos</span>
            <span className="hover:text-violet-200 cursor-pointer transition-colors">Garantia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
