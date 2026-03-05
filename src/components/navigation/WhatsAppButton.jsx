import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { BRAND_WHATSAPP } from "@/constants/brand";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";

export default function WhatsAppButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const reduceMotion = useShouldReduceMotion();
  const phoneNumber = BRAND_WHATSAPP;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.97 }}
            transition={reduceMotion ? undefined : { duration: 0.25 }}
            className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 w-72 border border-black/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
              href={`https://wa.me/${phoneNumber}?text=Hola,%20me%20gustaria%20hacer%20un%20pedido`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white py-3 rounded-xl text-sm font-medium hover:from-violet-500 hover:to-fuchsia-400 transition-all duration-300 group"
            >
              <MessageCircle className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Iniciar conversacion
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="relative w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/40 group overflow-hidden"
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      >
        {!reduceMotion && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-violet-200/40"
              animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-violet-200/25"
              animate={{ scale: [1, 1.7, 1.7], opacity: [0.4, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
            />
          </>
        )}

        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
