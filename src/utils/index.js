const ROUTES = {
  Home: "/",
  Products: "/products",
  Checkout: "/checkout",
  About: "/about",
  Contact: "/contact",
};

export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-'); // replace multiple - with single -
}

export function createProductSlug(product) {
  if (!product) return "";
  const base = slugify(product.nombre || product.name || "producto");
  if (!product.id) return base;
  return `${base}-${product.id.slice(-6)}`;
}

export function createPageUrl(pageName) {
  return ROUTES[pageName] || "/";
}

export function getPageNameFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const entry = Object.entries(ROUTES).find(([, path]) => path === normalized);
  return entry ? entry[0] : null;
}
