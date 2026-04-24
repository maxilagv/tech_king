import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240, // Only compress files > 10 KB
    }),
    // Brotli compression (better compression ratio)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    // Warn if a chunk exceeds 400 KB
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Firebase — large SDK, only needed for auth/db
          if (id.includes("node_modules/firebase")) {
            return "vendor-firebase";
          }
          // Framer Motion — only used in Layout
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer";
          }
          // GSAP — animation library
          if (id.includes("node_modules/gsap")) {
            return "vendor-gsap";
          }
          // Recharts — admin only
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
            return "vendor-charts";
          }
          // jsPDF — admin only
          if (id.includes("node_modules/jspdf") || id.includes("node_modules/jspdf-autotable")) {
            return "vendor-pdf";
          }
          // QR Code — admin only
          if (id.includes("node_modules/qrcode")) {
            return "vendor-qr";
          }
          // lucide-react icons
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // React core
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }
          // React Router
          if (id.includes("node_modules/react-router")) {
            return "vendor-router";
          }
        },
      },
    },
  },
});
