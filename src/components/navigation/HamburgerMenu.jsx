import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useMobileDrawerMenu } from "@/hooks/useNavigationMenu";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

export default function HamburgerMenu({ user, items = [] }) {
  const { isOpen, openAccordionId, closeMenu, toggleMenu, toggleAccordion } = useMobileDrawerMenu();
  const reduceMotion = useShouldReduceMotion();

  const lineVariants = {
    closed: {
      rotate: 0,
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
    },
    open: (i) => {
      if (i === 0) {
        return { rotate: 45, y: 8, transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] } };
      }
      if (i === 1) {
        return { opacity: 0, transition: { duration: 0.15 } };
      }
      return { rotate: -45, y: -8, transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] } };
    },
  };

  const overlayVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.01 } },
        exit: { opacity: 0, transition: { duration: 0.01 } },
      }
    : {
        hidden: { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, y: 18, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
      };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.01 }
        : { delay: 0.08 + i * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    }),
    exit: { opacity: 0, y: 8, transition: { duration: 0.16 } },
  };

  const overlay =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                id="mobile-navigation-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Menu principal"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-[100] tk-theme-bg tk-theme-text"
              >
                <div className="flex h-full flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+5.25rem)]">
                  <motion.div
                    variants={itemVariants}
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mb-4 flex items-center gap-3 border-b tk-theme-border pb-4"
                  >
                    <img
                      src={BRAND_LOGO_URL}
                      alt={BRAND_NAME}
                      className="h-10 w-10 rounded-lg border border-white/20 object-cover shadow-md shadow-black/15"
                      width="40"
                      height="40"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">{BRAND_NAME}</p>
                      <p className="truncate text-sm tk-theme-muted">Catalogo, cuenta y contacto</p>
                    </div>
                  </motion.div>

                  <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Navegacion mobile">
                    <div className="space-y-1">
                      {items.map((item, i) => {
                        const hasSubItems = Boolean(item.subItems?.length);
                        const accordionId = `mobile-submenu-${item.id}`;
                        const accordionOpen = openAccordionId === item.id;

                        return (
                          <motion.div
                            key={item.id}
                            custom={i + 1}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {hasSubItems ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion(item.id)}
                                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-lg px-3 text-left transition ${
                                    accordionOpen
                                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                      : "hover:bg-[var(--tk-field-bg)]"
                                  } focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
                                  aria-expanded={accordionOpen}
                                  aria-controls={accordionId}
                                >
                                  <span
                                    className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                                      accordionOpen ? "text-white/65" : "tk-theme-muted"
                                    }`}
                                  >
                                    0{i + 1}
                                  </span>
                                  <span className="min-w-0 flex-1 text-xl font-semibold tracking-normal">{item.label}</span>
                                  <ChevronDown
                                    className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                                      accordionOpen ? "rotate-180 text-white" : "tk-theme-muted"
                                    }`}
                                  />
                                </button>

                                <AnimatePresence initial={false}>
                                  {accordionOpen && (
                                    <motion.div
                                      id={accordionId}
                                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                                      animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                                      transition={reduceMotion ? undefined : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                                      className="overflow-hidden"
                                    >
                                      <div className="scrollbar-hide grid max-h-[42vh] gap-1 overflow-y-auto py-2 pl-8 pr-1">
                                        {item.subItems.map((subItem, subIndex) => (
                                          <Link
                                            key={subItem.id}
                                            to={subItem.to}
                                            onClick={closeMenu}
                                            className={`group flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm font-semibold transition hover:bg-[var(--tk-field-bg)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                                              subIndex === 0 ? "text-blue-600" : "tk-theme-text"
                                            }`}
                                          >
                                            <span className="min-w-0 truncate">{subItem.label}</span>
                                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-35 transition group-hover:opacity-100" />
                                          </Link>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <Link
                                to={item.to}
                                onClick={closeMenu}
                                className="flex min-h-[56px] items-center gap-3 rounded-lg px-3 transition hover:bg-[var(--tk-field-bg)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                              >
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] tk-theme-muted">
                                  0{i + 1}
                                </span>
                                <span className="min-w-0 flex-1 text-xl font-semibold tracking-normal">{item.label}</span>
                                <ArrowUpRight className="h-4 w-4 shrink-0 tk-theme-muted" />
                              </Link>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </nav>

                  <motion.div
                    variants={itemVariants}
                    custom={items.length + 1}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mt-4 grid gap-2 border-t tk-theme-border pt-4"
                  >
                    {!user ? (
                      <>
                        <Link
                          to="/checkout?mode=login"
                          onClick={closeMenu}
                          className="flex min-h-11 items-center justify-center rounded-lg border tk-theme-border px-4 text-xs font-bold uppercase tracking-[0.16em] tk-theme-text transition hover:bg-[var(--tk-field-bg)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                          Iniciar sesion
                        </Link>
                        <Link
                          to="/checkout?mode=register"
                          onClick={closeMenu}
                          className="flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-blue-700 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                          Registrarse
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/checkout"
                        onClick={closeMenu}
                        className="flex min-h-11 items-center justify-center rounded-lg border tk-theme-border px-4 text-xs font-bold uppercase tracking-[0.16em] tk-theme-text transition hover:bg-[var(--tk-field-bg)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        Mi cuenta
                      </Link>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={toggleMenu}
        className={`relative z-[110] w-10 h-10 flex flex-col items-center justify-center gap-[6px] rounded-lg backdrop-blur-sm transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
          isOpen
            ? "bg-blue-700 shadow-lg shadow-blue-900/35"
            : "bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/25"
        }`}
        aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={lineVariants}
            animate={isOpen ? "open" : "closed"}
            className="block h-[2px] w-6 rounded-full transition-colors duration-300 bg-white"
            style={{ originX: 0.5, originY: 0.5 }}
          />
        ))}
      </button>

      {overlay}
    </>
  );
}
