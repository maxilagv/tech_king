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
    desc: "Productos con respaldo del fabricante.",
  },
  {
    icon: Truck,
    title: "Envio rapido",
    desc: "Despacho agil y embalaje seguro.",
  },
  {
    icon: BadgeCheck,
    title: "Productos verificados",
    desc: "Marcas reales con stock disponible.",
  },
  {
    icon: Headphones,
    title: "Soporte dedicado",
    desc: "Asesoramiento antes y despues de comprar.",
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
      className="tk-landing-band py-10 md:py-14 tk-theme-bg border-y tk-theme-border"
      style={{ minHeight: "150px", contain: "layout" }}
    >
      <div className="tk-section-shell">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border tk-theme-border bg-[var(--tk-border)] lg:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="trust-badge group flex min-h-[130px] flex-col justify-between bg-[var(--tk-bg)] p-4 text-left transition-colors duration-300 hover:bg-[var(--tk-surface)] md:min-h-[150px] md:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border tk-theme-border bg-[var(--tk-surface)] text-blue-600 transition-transform duration-300 group-hover:-translate-y-1 md:h-11 md:w-11">
                  <badge.icon className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <span className="h-px w-8 bg-[var(--tk-border-strong)] opacity-60 transition-all duration-300 group-hover:w-12 group-hover:bg-blue-500" />
              </div>
              <div>
                <h3 className="tk-theme-text mb-1 text-sm font-bold md:text-base">{badge.title}</h3>
                <p className="tk-theme-muted text-xs leading-relaxed md:text-sm">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
