import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Search, X } from "lucide-react";
import HamburgerMenu from "./components/navigation/HamburgerMenu";
import CartNotice from "./components/navigation/CartNotice";
import ThemeToggleButton from "./components/navigation/ThemeToggleButton";
import FloatingActions from "./components/navigation/FloatingActions";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useTheme } from "@/context/ThemeContext";

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
  const [scrollY, setScrollY] = useState(0);
  const reduceMotion = useShouldReduceMotion();
  const { isDark } = useTheme();
  const isLandingRoute = location.pathname === createPageUrl("Home");
  const scrolled = scrollY > 60;
  const showBackToTop = isLandingRoute && scrollY > 640;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--tk-soft); }
        ::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #1d4ed8; }
        ::selection { background: #2563eb20; color: var(--tk-text); }
      `}</style>

      {/* Fixed Navigation Bar */}
      <motion.header
        initial={reduceMotion ? false : { y: -100 }}
        animate={reduceMotion ? undefined : { y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        className={`tk-mobile-section fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 transition-all duration-500 ${
          isHome && !scrolled
            ? "bg-transparent"
            : reduceMotion
              ? "tk-theme-surface border-b tk-theme-border shadow-sm"
              : "tk-theme-surface border-b tk-theme-border backdrop-blur-xl shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-3">
            <img
              src={BRAND_LOGO_URL}
              alt={BRAND_NAME}
              className="w-11 h-11 md:w-12 md:h-12 rounded-xl object-cover border border-white/25 shadow-lg shadow-black/20"
              decoding="async"
              loading="eager"
              width="48"
              height="48"
            />
            <span className={`text-xl font-semibold transition-colors duration-300 ${
              isHome
                ? isDark
                  ? "text-white"
                  : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] bg-black/35 px-3 py-1 rounded-lg border border-white/25"
                : "tk-theme-text"
            }`}>
              {BRAND_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className={`hidden md:flex items-center ${
              isHome && !isDark
                ? "gap-4 rounded-full bg-black/35 px-4 py-2 border border-white/25 backdrop-blur-md"
                : "gap-8"
            }`}
          >
            {[
              { to: createPageUrl("Home"), label: "Inicio" },
              { to: createPageUrl("Products"), label: "Productos" },
              { to: createPageUrl("About"), label: "Nosotros" },
              { to: createPageUrl("Contact"), label: "Contacto" },
            ].map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition-colors ${
                    isHome && !scrolled
                      ? isDark
                        ? `text-white hover:text-blue-200 ${isActive ? "font-semibold" : ""}`
                        : `text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] hover:text-blue-100 ${isActive ? "font-semibold" : ""}`
                      : isActive
                        ? "text-blue-600 font-semibold"
                        : "tk-theme-text hover:text-blue-500"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
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
                isHome && !scrolled
                  ? isDark
                    ? "text-white bg-white/10 hover:bg-white/20"
                    : "text-white bg-black/45 border border-white/25 shadow-lg shadow-black/35 hover:bg-black/60"
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
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${isHome && !scrolled
                      ? isDark
                        ? "border-white/40 text-white hover:bg-white/10"
                        : "border-white/25 bg-black/45 text-white shadow-lg shadow-black/35 hover:bg-black/60"
                      : "tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]"
                    }`}
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/checkout?mode=register"
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] transition-colors ${isHome && !scrolled
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
                className={`hidden md:flex px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${isHome && !scrolled
                    ? isDark
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-white/25 bg-black/45 text-white shadow-lg shadow-black/35 hover:bg-black/60"
                    : "tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]"
                  }`}
              >
                Mi cuenta
              </Link>
            )}
            <Link
              to="/checkout"
              className={`relative p-2 transition-colors duration-300 ${
                isHome && !scrolled ? "text-white hover:text-blue-200" : "tk-theme-text hover:text-blue-600"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={totalQty}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full text-[10px] text-white flex items-center justify-center font-medium"
                >
                  {totalQty}
                </motion.span>
              </AnimatePresence>
            </Link>
            {/* Hamburger only on mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggleButton compact />
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Buscar productos"
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isHome && !scrolled
                  ? isDark
                    ? "text-white bg-white/10 hover:bg-white/20"
                    : "text-white bg-black/45 border border-white/25 shadow-md shadow-black/35 hover:bg-black/60"
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
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
            transition={reduceMotion ? undefined : { duration: 0.22 }}
            className="pt-4"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-7xl mx-auto tk-theme-surface border tk-theme-border rounded-2xl shadow-xl p-2 md:p-3 flex items-center gap-2"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 text-blue-500 shrink-0 ml-2" />
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
      </motion.header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      <FloatingActions showBackToTop={showBackToTop} />
      <CartNotice />
    </div>
  );
}
