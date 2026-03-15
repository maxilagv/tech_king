import React from "react";
import { AnimatePresence } from "framer-motion";
import BackToTopButton from "./BackToTopButton";
import WhatsAppButton from "./WhatsAppButton";

export default function FloatingActions({ showBackToTop = false }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {showBackToTop ? <BackToTopButton /> : null}
      </AnimatePresence>
      <WhatsAppButton />
    </div>
  );
}
