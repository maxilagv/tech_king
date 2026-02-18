import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

const toneClasses = {
  success: "border-emerald-300/80 bg-emerald-600 text-white",
  warning: "border-amber-200/80 bg-amber-400 text-[#1f1300]",
  error: "border-red-300/80 bg-red-600 text-white",
};

function NoticeIcon({ tone }) {
  if (tone === "warning") return <AlertTriangle className="w-4 h-4 text-amber-300" />;
  if (tone === "error") return <XCircle className="w-4 h-4 text-red-300" />;
  return <CheckCircle2 className="w-4 h-4 text-emerald-300" />;
}

export default function CartNotice() {
  const { cartNotice, dismissCartNotice } = useCart();
  const tone = cartNotice?.tone || "success";
  const classes = toneClasses[tone] || toneClasses.success;

  return (
    <div className="fixed right-5 bottom-5 z-[70] pointer-events-none">
      <AnimatePresence>
        {cartNotice && (
          <motion.div
            key={cartNotice.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto w-[320px] max-w-[86vw] rounded-2xl border backdrop-blur-md shadow-2xl ${classes}`}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5">
                <NoticeIcon tone={tone} />
              </div>
              <p className="text-sm leading-relaxed font-medium">{cartNotice.text}</p>
              <button
                type="button"
                onClick={dismissCartNotice}
                className="ml-auto rounded-lg p-1 hover:bg-black/10 transition"
                aria-label="Cerrar notificacion"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
