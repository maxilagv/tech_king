import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ShoppingBag, Search } from "lucide-react";
import HamburgerMenu from "./components/navigation/HamburgerMenu";
import WhatsAppButton from "./components/navigation/WhatsAppButton";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";

export default function Layout({ children, currentPageName }) {
  const isHome = currentPageName === "Home";
  const { totalQty } = useCart();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #3B82F6; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #2563EB; }
        ::selection { background: #3B82F620; color: #0A0A0A; }
      `}</style>

      {/* Fixed Navigation Bar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 py-4 transition-all duration-500 ${isHome ? "bg-transparent" : "bg-white/95 backdrop-blur-xl border-b border-black/5 shadow-sm"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className={`text-xl font-semibold transition-colors duration-300 ${isHome ? "text-white" : "text-[#0A0A0A]"
              }`}>
              Tech King
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to={createPageUrl("Home")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${isHome ? "text-white hover:text-blue-300" : "text-[#0A0A0A]"
                }`}
            >
              Inicio
            </Link>
            <Link
              to={createPageUrl("Products")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${isHome ? "text-white hover:text-blue-300" : "text-[#0A0A0A]"
                }`}
            >
              Productos
            </Link>
            <Link
              to={createPageUrl("About")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${isHome ? "text-white hover:text-blue-300" : "text-[#0A0A0A]"
                }`}
            >
              Nosotros
            </Link>
            <Link
              to={createPageUrl("Contact")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${isHome ? "text-white hover:text-blue-300" : "text-[#0A0A0A]"
                }`}
            >
              Contacto
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className={`hidden md:flex p-2 transition-colors duration-300 ${isHome ? "text-white hover:text-blue-300" : "text-[#0A0A0A] hover:text-blue-600"
              }`}>
              <Search className="w-5 h-5" />
            </button>
            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/checkout?mode=login"
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${isHome
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-black/10 text-[#0A0A0A] hover:bg-black/5"
                    }`}
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/checkout?mode=register"
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] transition-colors ${isHome
                      ? "bg-white text-[#0A0A0A] hover:bg-white/90"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  Registrarse
                </Link>
              </div>
            ) : (
              <Link
                to="/checkout"
                className={`hidden md:flex px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${isHome
                    ? "border-white/40 text-white hover:bg-white/10"
                    : "border-black/10 text-[#0A0A0A] hover:bg-black/5"
                  }`}
              >
                Mi cuenta
              </Link>
            )}
            <Link
              to="/checkout"
              className={`relative p-2 transition-colors duration-300 ${isHome ? "text-white hover:text-blue-300" : "text-[#0A0A0A] hover:text-blue-600"
                }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                {totalQty}
              </span>
            </Link>
            {/* Hamburger only on mobile */}
            <div className="md:hidden">
              <HamburgerMenu isHome={isHome} user={user} />
            </div>
          </div>
        </div>
      </motion.header >

      {/* Page Content */}
      < main >
        {children}
      </main >

      {/* WhatsApp Floating Button */}
      < WhatsAppButton />
    </div >
  );
}
