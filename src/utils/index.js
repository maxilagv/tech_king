const ROUTES = {
  Home: "/",
  Products: "/products",
  Checkout: "/checkout",
  About: "/about",
  Contact: "/contact",
};

export function createPageUrl(pageName) {
  return ROUTES[pageName] || "/";
}

export function getPageNameFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const entry = Object.entries(ROUTES).find(([, path]) => path === normalized);
  return entry ? entry[0] : null;
}
