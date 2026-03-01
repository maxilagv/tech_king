import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ShoppingBag, Search, X } from "lucide-react";
import HamburgerMenu from "./components/navigation/HamburgerMenu";
import WhatsAppButton from "./components/navigation/WhatsAppButton";
import CartNotice from "./components/navigation/CartNotice";
import ThemeToggleButton from "./components/navigation/ThemeToggleButton";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";

function sanitizeSearchTerm(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export default function Layout({ children, currentPageName }) {
  const isHome = currentPageName === "Home";
  const { totalQty } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isProductsPage = location.pathname === createPageUrl("Products");
  const currentSearchTerm = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return sanitizeSearchTerm(params.get("q"));
  }, [location.search]);
  const hasSearchTerm = currentSearchTerm.length > 0;

  useEffect(() => {
    setSearchTerm(currentSearchTerm);
  }, [currentSearchTerm]);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;
    searchInputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchOpen]);

  const goToProductsWithParams = (term) => {
    const params = new URLSearchParams();
    if (isProductsPage) {
      const existing = new URLSearchParams(location.search);
      const activeCategory = existing.get("category");
      if (activeCategory) {
        params.set("category", activeCategory);
      }
    }
    if (term) {
      params.set("q", term);
    }

    navigate({
      pathname: createPageUrl("Products"),
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = sanitizeSearchTerm(searchTerm);
    goToProductsWithParams(term);
    setIsSearchOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    if (isProductsPage) {
      goToProductsWithParams("");
    }
  };

  return (
    <div className="min-h-screen tk-theme-bg font-sans tk-theme-text">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--tk-soft); }
        ::-webkit-scrollbar-thumb { background: #3B82F6; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #2563EB; }
        ::selection { background: #3B82F620; color: var(--tk-text); }
      `}</style>

      {/* Fixed Navigation Bar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 py-4 transition-all duration-500 ${
          isHome ? "bg-transparent" : "tk-theme-surface border-b tk-theme-border backdrop-blur-xl shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className={`text-xl font-semibold transition-colors duration-300 ${
              isHome ? "text-white" : "tk-theme-text"
            }`}>
              Tech King
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to={createPageUrl("Home")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                isHome ? "text-white hover:text-blue-300" : "tk-theme-text"
              }`}
            >
              Inicio
            </Link>
            <Link
              to={createPageUrl("Products")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                isHome ? "text-white hover:text-blue-300" : "tk-theme-text"
              }`}
            >
              Productos
            </Link>
            <Link
              to={createPageUrl("About")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                isHome ? "text-white hover:text-blue-300" : "tk-theme-text"
              }`}
            >
              Nosotros
            </Link>
            <Link
              to={createPageUrl("Contact")}
              className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                isHome ? "text-white hover:text-blue-300" : "tk-theme-text"
              }`}
            >
              Contacto
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <ThemeToggleButton compact />
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label="Buscar productos"
              className={`hidden md:flex p-2 rounded-lg transition-colors duration-300 ${
                isHome
                  ? "text-white bg-white/10 hover:bg-white/20"
                  : hasSearchTerm
                    ? "text-white bg-blue-600 hover:bg-blue-700"
                    : "tk-theme-text bg-[var(--tk-field-bg)] hover:bg-blue-100"
              }`}
            >
              <Search className="w-5 h-5" />
            </button>
            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/checkout?mode=login"
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${isHome
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]"
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
                    : "tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]"
                  }`}
              >
                Mi cuenta
              </Link>
            )}
            <Link
              to="/checkout"
              className={`relative p-2 transition-colors duration-300 ${
                isHome ? "text-white hover:text-blue-300" : "tk-theme-text hover:text-blue-600"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                {totalQty}
              </span>
            </Link>
            {/* Hamburger only on mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggleButton compact />
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Buscar productos"
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isHome
                    ? "text-white bg-white/10 hover:bg-white/20"
                    : hasSearchTerm
                      ? "text-white bg-blue-600 hover:bg-blue-700"
                      : "tk-theme-text bg-[var(--tk-field-bg)] hover:bg-blue-100"
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
              <HamburgerMenu user={user} />
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
            className="pt-4"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-7xl mx-auto tk-theme-surface border tk-theme-border rounded-2xl shadow-xl p-2 md:p-3 flex items-center gap-2"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 text-blue-600 shrink-0 ml-2" />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                type="search"
                placeholder="Buscar por producto, marca, categoria, modelo o SKU"
                className="flex-1 min-w-0 bg-transparent outline-none tk-theme-text placeholder:text-slate-400 text-sm md:text-base"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="w-9 h-9 rounded-lg tk-theme-text opacity-70 hover:opacity-100 hover:bg-[var(--tk-field-bg)] flex items-center justify-center"
                  aria-label="Limpiar busqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 md:px-5 h-9 rounded-xl bg-blue-600 text-white text-xs md:text-sm tracking-[0.12em] uppercase font-semibold hover:bg-blue-700 transition-colors"
              >
                Buscar
              </button>
            </form>
          </motion.div>
        )}
      </motion.header >

      {/* Page Content */}
      < main >
        {children}
      </main >

      {/* WhatsApp Floating Button */}
      < WhatsAppButton />
      <CartNotice />
    </div >
  );
}
