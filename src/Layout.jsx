import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Search, X } from "lucide-react";
import HamburgerMenu from "./components/navigation/HamburgerMenu";
import DesktopNav from "./components/navigation/DesktopNav";
import CartNotice from "./components/navigation/CartNotice";
import ThemeToggleButton from "./components/navigation/ThemeToggleButton";
import FloatingActions from "./components/navigation/FloatingActions";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { useTheme } from "@/context/ThemeContext";
import { buildNavigationItems } from "@/components/navigation/navigationItems";

function sanitizeSearchTerm(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export default function Layout({ children, currentPageName }) {
  const isHome = currentPageName === "Home";
  const { totalQty } = useCart();
  const { user } = useAuth();
  const { categories } = useCategories({ onlyActive: true });
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const reduceMotion = useShouldReduceMotion();
  const logoMagnetic = useMagneticHover({ strength: 0.18, max: 5 });
  const { isDark } = useTheme();
  const isLandingRoute = location.pathname === createPageUrl("Home");
  const scrolled = scrollY > 60;
  const showBackToTop = isLandingRoute && scrollY > 640;
  const navigationItems = useMemo(() => buildNavigationItems(categories), [categories]);

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
        className={`tk-mobile-section fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-500 sm:px-6 lg:px-10 ${
          isHome && !scrolled
            ? "bg-transparent"
            : reduceMotion
              ? "tk-theme-surface border-b tk-theme-border shadow-sm"
              : "tk-theme-surface border-b tk-theme-border backdrop-blur-xl shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link
            to={createPageUrl("Home")}
            className="group flex items-center gap-3"
            ref={logoMagnetic.inert ? undefined : logoMagnetic.ref}
            onMouseMove={logoMagnetic.inert ? undefined : logoMagnetic.onMouseMove}
            onMouseLeave={logoMagnetic.inert ? undefined : logoMagnetic.onMouseLeave}
          >
            <img
              src={BRAND_LOGO_URL}
              alt={BRAND_NAME}
              className="h-10 w-10 rounded-lg border border-white/25 object-cover shadow-lg shadow-black/20 transition-transform duration-300 group-hover:-translate-y-0.5 md:h-11 md:w-11"
              decoding="async"
              loading="eager"
              width="48"
              height="48"
            />
            <span className={`text-xl font-semibold transition-colors duration-300 ${
              isHome && !scrolled
                ? isDark
                    ? "text-white"
                    : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                : "tk-theme-text"
            }`}>
              {BRAND_NAME}
            </span>
          </Link>

          <DesktopNav
            items={navigationItems}
            location={location}
            isFloatingOnHero={isHome && !scrolled && !isDark}
            reduceMotion={reduceMotion}
            isDark={isDark}
          />

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
                    : "text-white bg-black/32 border border-white/18 shadow-lg shadow-black/30 hover:bg-black/46"
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
                  className={`rounded-lg border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${isHome && !scrolled
                      ? isDark
                      ? "border-white/40 text-white hover:bg-white/10"
                        : "border-white/20 bg-black/32 text-white shadow-lg shadow-black/30 hover:bg-black/46"
                      : "tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]"
                    }`}
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/checkout?mode=register"
                  className={`rounded-lg px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${isHome && !scrolled
                      ? "bg-white text-[#0A0A0A] hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  Registrarse
                </Link>
              </div>
            ) : (
              <Link
                to="/checkout"
                className={`hidden rounded-lg border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors md:flex ${isHome && !scrolled
                    ? isDark
                    ? "border-white/40 text-white hover:bg-white/10"
                      : "border-white/20 bg-black/32 text-white shadow-lg shadow-black/30 hover:bg-black/46"
                    : "tk-theme-border tk-theme-text hover:bg-[var(--tk-field-bg)]"
                  }`}
              >
                Mi cuenta
              </Link>
            )}
            <Link
              to="/checkout"
              data-cart-target
              aria-label="Ver carrito"
              className={`relative rounded-lg p-2 transition-colors duration-300 ${
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
                    : "text-white bg-black/32 border border-white/18 shadow-md shadow-black/30 hover:bg-black/46"
                  : hasSearchTerm
                      ? "text-white bg-blue-600 hover:bg-blue-700"
                      : "tk-theme-text bg-[var(--tk-field-bg)] hover:bg-blue-100"
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
              <HamburgerMenu user={user} items={navigationItems} />
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
              className="tk-focus-glow mx-auto flex max-w-7xl items-center gap-2 rounded-lg border tk-theme-border tk-theme-surface p-2 shadow-xl md:p-3"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg tk-theme-text opacity-70 hover:bg-[var(--tk-field-bg)] hover:opacity-100"
                  aria-label="Limpiar busqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-blue-700 md:px-5 md:text-sm"
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
