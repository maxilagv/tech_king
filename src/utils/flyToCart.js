/**
 * Fly-to-cart feedback: clones the product image and animates it toward the
 * navbar cart icon, then gives the cart a quick pop. Pure DOM / Web Animations
 * API — no React state, no context changes.
 *
 * The cart target must carry `data-cart-target` (set on the cart Link in Layout).
 *
 * @param {HTMLElement|null} originEl - the product <img> (or any element with a bounding box / background image).
 * @param {{ reduceMotion?: boolean, targetSelector?: string }} [options]
 */
export function flyToCart(originEl, options = {}) {
  if (typeof document === "undefined") return;
  const { reduceMotion = false, targetSelector = "[data-cart-target]" } = options;
  const target = document.querySelector(targetSelector);

  const popCart = () => {
    if (!target) return;
    target.classList.remove("animate-tk-fly-pop");
    // Force reflow so the animation can retrigger on rapid adds.
    void target.offsetWidth;
    target.classList.add("animate-tk-fly-pop");
    const clear = () => target.classList.remove("animate-tk-fly-pop");
    target.addEventListener("animationend", clear, { once: true });
  };

  // Reduced motion / no source: just pop the cart, skip the flight.
  if (reduceMotion || !originEl || !target || typeof originEl.getBoundingClientRect !== "function") {
    popCart();
    return;
  }

  const src =
    originEl.currentSrc ||
    originEl.src ||
    (typeof originEl.style?.backgroundImage === "string"
      ? originEl.style.backgroundImage.replace(/^url\(["']?/, "").replace(/["']?\)$/, "")
      : "");
  if (!src) {
    popCart();
    return;
  }

  const startRect = originEl.getBoundingClientRect();
  const endRect = target.getBoundingClientRect();
  if (startRect.width === 0 || startRect.height === 0) {
    popCart();
    return;
  }

  const size = Math.min(120, Math.max(56, startRect.width * 0.55));
  const clone = document.createElement("img");
  clone.src = src;
  clone.setAttribute("aria-hidden", "true");
  clone.style.cssText = [
    "position:fixed",
    `left:${startRect.left + startRect.width / 2 - size / 2}px`,
    `top:${startRect.top + startRect.height / 2 - size / 2}px`,
    `width:${size}px`,
    `height:${size}px`,
    "object-fit:cover",
    "border-radius:14px",
    "box-shadow:0 18px 40px -12px rgba(8,18,34,0.55)",
    "pointer-events:none",
    "z-index:80",
    "will-change:transform,opacity",
  ].join(";");

  document.body.appendChild(clone);

  const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
  const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

  let animation;
  try {
    animation = clone.animate(
      [
        { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(0.7)`, opacity: 0.95, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0.2 },
      ],
      { duration: 700, easing: "cubic-bezier(0.5, 0, 0.3, 1)", fill: "forwards" }
    );
  } catch {
    clone.remove();
    popCart();
    return;
  }

  const cleanup = () => {
    clone.remove();
    popCart();
  };
  animation.addEventListener("finish", cleanup, { once: true });
  animation.addEventListener("cancel", cleanup, { once: true });
}
