import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useMobileDrawerMenu } from "@/hooks/useNavigationMenu";

export default function HamburgerMenu({ user, items = [] }) {
  const { isOpen, openAccordionId, closeMenu, toggleMenu, toggleAccordion } = useMobileDrawerMenu();

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

  const overlayVariants = {
    hidden: { clipPath: "circle(0px at calc(100% - 40px) 40px)" },
    visible: {
      clipPath: "circle(140vmax at calc(100% - 40px) 40px)",
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      clipPath: "circle(0px at calc(100% - 40px) 40px)",
      transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 80 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.76, 0, 0.24, 1] },
    }),
    exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
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
                className="fixed inset-0 z-[100] bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex flex-col"
              >
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-300/10" />
                  <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white/5" />
                </div>

                <div className="flex-1 flex items-center justify-center px-8">
                  <nav className="flex w-full max-w-xl flex-col gap-2" aria-label="Navegacion mobile">
                    {items.map((item, i) => {
                      const hasSubItems = Boolean(item.subItems?.length);
                      const accordionId = `mobile-submenu-${item.id}`;
                      const accordionOpen = openAccordionId === item.id;

                      return (
                      <motion.div
                        key={item.id}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {hasSubItems ? (
                          <div className="rounded-lg">
                            <button
                              type="button"
                              onClick={() => toggleAccordion(item.id)}
                              className="group flex w-full items-center gap-4 py-3 text-left"
                              aria-haspopup="true"
                              aria-expanded={accordionOpen}
                              aria-controls={accordionId}
                            >
                              <span className="text-blue-200/45 text-sm font-light tracking-[0.3em] uppercase">
                                0{i + 1}
                              </span>
                              <span className="min-w-0 flex-1 text-5xl font-light tracking-tight text-white transition-colors duration-500 group-hover:text-blue-200 md:text-7xl">
                                {item.label}
                              </span>
                              <ChevronDown
                                className={`h-7 w-7 shrink-0 text-blue-100 transition-transform duration-300 ${
                                  accordionOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <AnimatePresence initial={false}>
                              {accordionOpen && (
                                <motion.div
                                  id={accordionId}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-16 grid max-h-[34vh] gap-1 overflow-y-auto border-l border-white/15 py-2 pl-4">
                                    {item.subItems.map((subItem) => (
                                      <Link
                                        key={subItem.id}
                                        to={subItem.to}
                                        onClick={closeMenu}
                                        className="rounded-md px-3 py-2 text-base font-medium text-white/78 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                      >
                                        {subItem.label}
                                      </Link>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <Link to={item.to} onClick={closeMenu} className="group flex items-center gap-4 py-3">
                            <span className="text-blue-200/45 text-sm font-light tracking-[0.3em] uppercase">
                              0{i + 1}
                            </span>
                            <span className="text-5xl font-light tracking-tight text-white transition-colors duration-500 group-hover:text-blue-200 md:text-7xl">
                              {item.label}
                            </span>
                            <motion.span
                              className="h-[1px] bg-blue-200 origin-left"
                              initial={{ width: 0 }}
                              whileHover={{ width: 60 }}
                              transition={{ duration: 0.4 }}
                            />
                          </Link>
                        )}
                      </motion.div>
                    );
                    })}

                    {!user ? (
                      <div className="mt-10 flex flex-col gap-3">
                        <Link
                          to="/checkout?mode=login"
                          onClick={closeMenu}
                          className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-white/10 transition"
                        >
                          Iniciar sesion
                        </Link>
                        <Link
                          to="/checkout?mode=register"
                          onClick={closeMenu}
                          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs uppercase tracking-[0.2em] text-[#0A0A0A] hover:bg-white/90 transition"
                        >
                          Registrarse
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-10">
                        <Link
                          to="/checkout"
                          onClick={closeMenu}
                          className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-white/10 transition"
                        >
                          Mi cuenta
                        </Link>
                      </div>
                    )}
                  </nav>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="px-8 pb-10 flex justify-between items-end text-white/40 text-xs tracking-[0.2em] uppercase"
                >
                  <span>Tecnologia premium</span>
                  <span>Est. 2026</span>
                </motion.div>
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
