export const ADMIN_MODULES = Object.freeze([
  { id: "products", label: "Productos", path: "/admin/productos", employeeAllowed: true },
  { id: "categories", label: "Categorias", path: "/admin/categorias", employeeAllowed: true },
  { id: "offers", label: "Ofertas", path: "/admin/ofertas", employeeAllowed: true },
  { id: "customers", label: "Clientes", path: "/admin/clientes", employeeAllowed: true },
  { id: "orders", label: "Pedidos", path: "/admin/pedidos", employeeAllowed: true },
  { id: "remitos", label: "Remitos", path: "/admin/remitos", employeeAllowed: true },
  { id: "suppliers", label: "Proveedores", path: "/admin/proveedores", employeeAllowed: false },
  { id: "costs", label: "Costos", path: "/admin/costos", employeeAllowed: false },
  { id: "stock", label: "Stock", path: "/admin/stock", employeeAllowed: false },
  { id: "finance", label: "Finanzas", path: "/admin/finanzas", employeeAllowed: false },
  { id: "users", label: "Usuarios", path: "/admin/usuarios", employeeAllowed: false },
]);

export const ALL_ADMIN_MODULE_IDS = Object.freeze(ADMIN_MODULES.map((module) => module.id));

export const EMPLOYEE_MODULE_IDS = Object.freeze(
  ADMIN_MODULES.filter((module) => module.employeeAllowed).map((module) => module.id)
);

export const EMPLOYEE_DEFAULT_MODULE_ORDER = EMPLOYEE_MODULE_IDS;

export const ADMIN_MODULE_PATH_BY_ID = Object.freeze(
  Object.fromEntries(ADMIN_MODULES.map((module) => [module.id, module.path]))
);

export function normalizeAdminModules(rawModules) {
  if (!Array.isArray(rawModules)) return [];
  const unique = new Set();
  for (const raw of rawModules) {
    const moduleId = typeof raw === "string" ? raw.trim() : "";
    if (!moduleId) continue;
    if (!ALL_ADMIN_MODULE_IDS.includes(moduleId)) continue;
    unique.add(moduleId);
  }
  return Array.from(unique);
}

export function getDefaultAdminPath({ isSuperAdmin = false, modules = [] } = {}) {
  if (isSuperAdmin) return "/admin";
  for (const moduleId of EMPLOYEE_DEFAULT_MODULE_ORDER) {
    if (modules.includes(moduleId)) {
      return ADMIN_MODULE_PATH_BY_ID[moduleId];
    }
  }
  return "/admin/login";
}
