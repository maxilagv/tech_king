module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        nexa: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
          950: "#020c1e",
        },
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59,130,246,0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(59,130,246,0.8), 0 0 60px rgba(59,130,246,0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "tk-sheen": {
          "0%": { transform: "translateX(-130%) skewX(-18deg)" },
          "100%": { transform: "translateX(230%) skewX(-18deg)" },
        },
        "tk-border-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "tk-fly-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        "tk-check-pop": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 28s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "tk-sheen": "tk-sheen 0.85s ease-out",
        "tk-border-pan": "tk-border-pan 6s ease infinite",
        "tk-fly-pop": "tk-fly-pop 0.45s cubic-bezier(0.22,1,0.36,1)",
        "tk-check-pop": "tk-check-pop 0.4s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
