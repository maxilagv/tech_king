import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const phoneNumber = "5491112345678"; // Replace with actual number

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
            className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 w-72 border border-black/5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-[#0A0A0A]/60 tracking-wide uppercase">
                  En línea
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[#0A0A0A]/30 hover:text-[#0A0A0A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-[#0A0A0A] font-semibold text-base mb-1">
              ¡Hola! 👋
            </h4>
            <p className="text-[#0A0A0A]/60 text-sm leading-relaxed mb-4">
              ¿Necesitas ayuda con tu pedido? Escríbenos y te atendemos al instante.
            </p>

            <a
              href={`https://wa.me/${phoneNumber}?text=Hola,%20me%20gustaría%20hacer%20un%20pedido`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition-all duration-500 group"
            >
              <MessageCircle className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Iniciar conversación
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 group overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-300/40"
          animate={{
            scale: [1, 1.4, 1.4],
            opacity: [0.6, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-300/20"
          animate={{
            scale: [1, 1.7, 1.7],
            opacity: [0.4, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.3,
          }}
        />

        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-300/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
