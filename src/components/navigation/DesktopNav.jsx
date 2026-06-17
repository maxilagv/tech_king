import React from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useDesktopDropdown } from "@/hooks/useNavigationMenu";

export default function DesktopNav({ items, location, isFloatingOnHero, reduceMotion, isDark }) {
  const { openItemId, openDropdown, closeDropdown, scheduleClose } = useDesktopDropdown();

  const baseNavClass = isFloatingOnHero
    ? "gap-2 rounded-lg border border-white/18 bg-black/28 p-1.5 backdrop-blur-md"
    : "gap-8";

  const getItemClass = (isActive) =>
    `rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors ${
      isFloatingOnHero
        ? isDark
          ? `text-white hover:bg-white/10 hover:text-blue-100 ${isActive ? "bg-white/10" : ""}`
          : `text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] hover:bg-white/10 hover:text-blue-100 ${
              isActive ? "bg-white/10" : ""
            }`
        : isActive
          ? "text-blue-600 font-semibold"
          : "tk-theme-text hover:text-blue-500"
    }`;

  return (
    <nav className={`hidden items-center md:flex ${baseNavClass}`} aria-label="Navegacion principal">
      {items.map((item) => {
        const hasSubItems = Boolean(item.subItems?.length);
        const isActive = location.pathname === item.to || (item.id === "products" && location.pathname.startsWith("/products"));
        const isOpen = openItemId === item.id;
        const menuId = `desktop-submenu-${item.id}`;

        if (!hasSubItems) {
          return (
            <Link key={item.id} to={item.to} className={getItemClass(isActive)} aria-current={isActive ? "page" : undefined}>
              {item.label}
            </Link>
          );
        }

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => openDropdown(item.id)}
            onMouseLeave={scheduleClose}
            onFocus={() => openDropdown(item.id)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                scheduleClose();
              }
            }}
          >
            <button
              type="button"
              onClick={() => openDropdown(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeDropdown();
                  event.currentTarget.focus();
                }
              }}
              className={`${getItemClass(isActive)} inline-flex items-center gap-1.5`}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={menuId}
                  role="menu"
                  initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
                  transition={reduceMotion ? undefined : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-full z-[70] mt-3 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border tk-theme-border bg-[var(--tk-surface)] p-2 shadow-2xl shadow-black/15"
                  onMouseEnter={() => openDropdown(item.id)}
                  onMouseLeave={scheduleClose}
                >
                  <div className="absolute -top-4 left-0 right-0 h-4" />
                  <div className="grid max-h-[420px] grid-cols-2 gap-1 overflow-y-auto pr-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        to={subItem.to}
                        role="menuitem"
                        onClick={closeDropdown}
                        className="rounded-md px-3 py-2 text-sm font-semibold tk-theme-text transition hover:bg-[var(--tk-field-bg)] hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
