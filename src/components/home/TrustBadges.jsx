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

    gsap.fromTo(".trust-badge", 
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  }, { scope: sectionRef, dependencies: [reduceMotion] });

  return (
    <section ref={sectionRef} className="py-16 px-6 md:px-16 lg:px-24 tk-theme-bg border-y tk-theme-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge, i) => (
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
