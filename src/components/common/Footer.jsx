import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";
import { BRAND_NAME, BRAND_WHATSAPP } from "@/constants/brand";
import { useBusinessConfig } from "@/hooks/useBusinessConfig";
import {
  createMailHref,
  createMapsHref,
  createPhoneHref,
} from "@/utils/businessConfig";

const HORARIOS = [
  { dia: "Lunes a Viernes", horario: "10:00 — 20:00" },
  { dia: "Sábado", horario: "10:00 — 18:00" },
  { dia: "Domingo", horario: "Cerrado" },
];

const NAV_LINKS = [
  { label: "Inicio", page: "Home" },
  { label: "Productos", page: "Products" },
  { label: "Nosotros", page: "About" },
  { label: "Contacto", page: "Contact" },
];

export default function Footer() {
  const { businessConfig } = useBusinessConfig();
  const phoneHref = createPhoneHref(businessConfig);
  const mailHref = createMailHref(businessConfig);
  const mapsHref = createMapsHref(businessConfig);
  const waHref = `https://wa.me/${BRAND_WHATSAPP}?text=Hola%20Nexastore%2C%20quiero%20consultar%20sobre%20un%20producto.`;

  return (
    <footer className="relative overflow-hidden bg-[#020c1e] text-white pt-20 pb-8 px-6 md:px-16 lg:px-24">
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-8%] w-[460px] h-[460px] rounded-full bg-blue-500/15 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[-12%] w-[520px] h-[520px] rounded-full bg-sky-500/15 blur-[170px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand col */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold font-display tracking-tight mb-3">{BRAND_NAME}</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Tecnología premium en Once, Buenos Aires. Garantía real, precios justos y atención personalizada.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-white/60 hover:text-green-400 hover:border-green-400/40 hover:bg-green-400/10 transition-all duration-300"
              >
                {/* WhatsApp icon via SVG */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-white/60 hover:text-pink-400 hover:border-pink-400/40 hover:bg-pink-400/10 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-white/60 hover:text-blue-400 hover:border-blue-400/40 hover:bg-blue-400/10 transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav col */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-white/50 mb-6 font-semibold">Navegación</h4>
            <ul className="space-y-3">
              {NAV_LINKS.map(({ label, page }) => (
                <li key={page}>
                  <Link
                    to={createPageUrl(page)}
                    className="text-white/55 text-sm hover:text-blue-300 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-500/0 group-hover:bg-blue-400 transition-all duration-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Horarios col */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-white/50 mb-6 font-semibold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Horarios
            </h4>
            <ul className="space-y-3">
              {HORARIOS.map(({ dia, horario }) => (
                <li key={dia} className="flex flex-col gap-0.5">
                  <span className="text-white/40 text-[11px] uppercase tracking-[0.12em]">{dia}</span>
                  <span className={`text-sm font-medium ${horario === "Cerrado" ? "text-white/30" : "text-white/80"}`}>
                    {horario}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto col */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-white/50 mb-6 font-semibold">Contacto</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={mailHref}
                  className="flex items-start gap-3 text-white/55 text-sm hover:text-blue-300 transition-colors duration-300 group"
                >
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                  {businessConfig.supportEmail}
                </a>
              </li>
              <li>
                <a
                  href={phoneHref}
                  className="flex items-start gap-3 text-white/55 text-sm hover:text-blue-300 transition-colors duration-300 group"
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                  {businessConfig.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-white/55 text-sm hover:text-blue-300 transition-colors duration-300 group"
                >
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                  <span>
                    {businessConfig.address}
                    <span className="block text-[11px] text-white/35 mt-0.5">Once, Buenos Aires · Ver en Maps</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-white/[0.08] mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/35 text-xs tracking-[0.1em]">
          <span>&copy; 2026 {BRAND_NAME}. Todos los derechos reservados.</span>
          <div className="flex gap-6">
            <span className="hover:text-blue-300 cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-blue-300 cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-blue-300 cursor-pointer transition-colors">Garantía</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
