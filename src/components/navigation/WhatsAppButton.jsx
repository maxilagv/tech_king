import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useBusinessConfig } from "@/hooks/useBusinessConfig";
import { createWhatsAppUrl } from "@/utils/businessConfig";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

export default function WhatsAppButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const reduceMotion = useShouldReduceMotion();
  const { businessConfig } = useBusinessConfig();
  const whatsappHref = createWhatsAppUrl(
    businessConfig,
    "Hola, me gustaria hacer un pedido."
  );

  return (
    <div className="relative flex flex-col items-end gap-3">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.97 }}
            transition={reduceMotion ? undefined : { duration: 0.25 }}
            className="absolute bottom-full right-0 mb-3 bg-white rounded-2xl shadow-2xl shadow-black/10 p-4 sm:p-5 w-[min(18rem,88vw)] border border-black/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-green-500 ${reduceMotion ? "" : "animate-pulse"}`} />
                <span className="text-xs font-medium text-[#0A0A0A]/60 tracking-wide uppercase">
                  En linea
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[#0A0A0A]/30 hover:text-[#0A0A0A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-[#0A0A0A] font-semibold text-base mb-1">Hola!</h4>
            <p className="text-[#0A0A0A]/60 text-sm leading-relaxed mb-4">
              Necesitas ayuda con tu pedido? Escribenos y te atendemos al instante.
            </p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl text-sm font-medium hover:from-green-400 hover:to-emerald-400 transition-all duration-300 group"
            >
              <MessageCircle className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Iniciar conversacion
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 group overflow-hidden"
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      >
        {!reduceMotion && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-200/40"
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-green-200/25"
              animate={{ scale: [1, 1.7, 1.7], opacity: [0.4, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
            />
          </>
        )}

        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
              animate={reduceMotion ? undefined : { rotate: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
              transition={reduceMotion ? undefined : { duration: 0.2 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
              animate={reduceMotion ? undefined : { rotate: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
              transition={reduceMotion ? undefined : { duration: 0.2 }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
