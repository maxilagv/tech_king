import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingBag, X } from "lucide-react";

const menuItems = [
  { label: "Inicio", page: "Home" },
  { label: "Productos", page: "Products" },
  { label: "Nosotros", page: "About" },
  { label: "Contacto", page: "Contact" },
];

export default function HamburgerMenu({ isHome }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const lineVariants = {
    closed: (i) => ({
      rotate: 0,
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
    }),
    open: (i) => {
      if (i === 0) return { rotate: 45, y: 8, transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] } };
      if (i === 1) return { opacity: 0, transition: { duration: 0.15 } };
      if (i === 2) return { rotate: -45, y: -8, transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] } };
    },
  };

  const overlayVariants = {
    hidden: { clipPath: "circle(0% at calc(100% - 40px) 40px)" },
    visible: {
      clipPath: "circle(150% at calc(100% - 40px) 40px)",
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      clipPath: "circle(0% at calc(100% - 40px) 40px)",
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

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-[60] w-10 h-10 flex flex-col items-center justify-center gap-[6px] focus:outline-none rounded-lg backdrop-blur-sm transition-colors duration-300 ${isOpen
            ? "bg-transparent"
            : isHome
              ? "bg-white/10 hover:bg-white/20"
              : "bg-black/5 hover:bg-black/10"
          }`}
        aria-label="Menu"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={lineVariants}
            animate={isOpen ? "open" : "closed"}
            className={`block h-[2px] w-6 rounded-full transition-colors duration-300 ${isOpen
                ? "bg-white"
                : isHome
                  ? "bg-white"
                  : "bg-[#0A0A0A]"
              }`}
            style={{ originX: 0.5, originY: 0.5 }}
          />
        ))}
      </button>

      {/* Full-screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-400/10" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white/5" />
            </div>

            <div className="flex-1 flex items-center justify-center px-8">
              <nav className="flex flex-col gap-2">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.page}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center gap-4 py-3"
                    >
                      <span className="text-cyan-300/40 text-sm font-light tracking-[0.3em] uppercase">
                        0{i + 1}
                      </span>
                      <span className="text-white text-5xl md:text-7xl font-light tracking-tight group-hover:text-cyan-300 transition-colors duration-500">
                        {item.label}
                      </span>
                      <motion.span
                        className="h-[1px] bg-cyan-300 origin-left"
                        initial={{ width: 0 }}
                        whileHover={{ width: 60 }}
                        transition={{ duration: 0.4 }}
                      />
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="px-8 pb-10 flex justify-between items-end text-white/40 text-xs tracking-[0.2em] uppercase"
            >
              <span>Tecnología Premium</span>
              <span>Est. 2026</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
