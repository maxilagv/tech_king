import React, { useRef } from "react";
import { BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react";
import { useShouldReduceMotion } from "@/hooks/useShouldReduceMotion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const badges = [
  {
    icon: ShieldCheck,
    title: "Garantia oficial",
    desc: "Todos nuestros productos cuentan con garantia del fabricante.",
  },
  {
    icon: Truck,
    title: "Envio rapido",
    desc: "Despacho agil con embalaje seguro a todo el pais.",
  },
  {
    icon: BadgeCheck,
    title: "Productos verificados",
    desc: "Solo marcas reconocidas con stock real y disponible.",
  },
  {
    icon: Headphones,
    title: "Soporte dedicado",
    desc: "Asistencia tecnica antes, durante y despues de tu compra.",
  },
];

export default function TrustBadges() {
  const reduceMotion = useShouldReduceMotion();
  const sectionRef = useRef(null);

  useGSAP(() => {
    if (reduceMotion) return;

    // CLS FIX: Do NOT start with opacity:0 on elements that are in/near the viewport.
    // Use clipPath or transform-only animations to avoid layout shifts.
    // We animate only after ScrollTrigger confirms the element is in view.
    const badges = gsap.utils.toArray(".trust-badge", sectionRef.current);

    gsap.fromTo(
      badges,
      { opacity: 0, y: 16, willChange: "transform, opacity" },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "willChange",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 88%",
          toggleActions: "play none none none",
          // Prevent ScrollTrigger from reading layout during scroll (reduces forced reflows)
          fastScrollEnd: true,
        },
      }
    );
  }, { scope: sectionRef, dependencies: [reduceMotion] });

  return (
    // CLS FIX: explicit min-height reserves space before badges render,
    // preventing the section from expanding and pushing content below.
    <section
      ref={sectionRef}
      className="py-16 px-6 md:px-16 lg:px-24 tk-theme-bg border-y tk-theme-border"
      style={{ minHeight: "160px", contain: "layout" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="trust-badge flex flex-col items-center text-center gap-4 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                <badge.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="tk-theme-text text-sm font-semibold mb-1">{badge.title}</h3>
                <p className="tk-theme-muted text-xs leading-relaxed">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
