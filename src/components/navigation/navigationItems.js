import { createPageUrl } from "@/utils";

export function buildNavigationItems(categories = []) {
  const productSubItems = [
    { id: "products-all", label: "Todos los productos", to: createPageUrl("Products") },
    ...categories.map((category) => {
      const categoryKey = category.slug || category.id;
      return {
        id: `category-${categoryKey}`,
        label: category.nombre || "Categoria",
        to: `${createPageUrl("Products")}?category=${encodeURIComponent(categoryKey)}`,
      };
    }),
  ];

  return [
    { id: "home", label: "Inicio", to: createPageUrl("Home") },
    {
      id: "products",
      label: "Productos",
      to: createPageUrl("Products"),
      subItems: productSubItems,
    },
    { id: "about", label: "Nosotros", to: createPageUrl("About") },
    { id: "blog", label: "Blog", to: createPageUrl("Blog") },
    { id: "contact", label: "Contacto", to: createPageUrl("Contact") },
  ];
}
