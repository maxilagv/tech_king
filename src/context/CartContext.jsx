import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "techking_cart";

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const qty = Math.floor(parsed);
  return qty > 0 ? qty : fallback;
}

function normalizeStockLimit(rawStock) {
  if (rawStock === undefined || rawStock === null || rawStock === "") {
    return Number.POSITIVE_INFINITY;
  }
  const parsed = Number(rawStock);
  if (!Number.isFinite(parsed)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, Math.floor(parsed));
}

function sanitizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  const unique = new Map();

  for (const item of rawItems) {
    const id = String(item?.id || "").trim();
    if (!id) continue;

    const nombre = String(item?.nombre || "Producto");
    const precio = Number(item?.precio || 0);
    const stockMax = normalizeStockLimit(item?.stockMax);
    const cantidad = Math.min(parsePositiveInt(item?.cantidad, 1), stockMax);

    if (!Number.isFinite(precio) || cantidad <= 0) continue;

    if (!unique.has(id)) {
      unique.set(id, {
        id,
        nombre,
        precio,
        imagen: item?.imagen || "",
        categorySlug: item?.categorySlug || "",
        cantidad,
        stockMax,
      });
      continue;
    }

    const existing = unique.get(id);
    existing.cantidad = Math.min(existing.cantidad + cantidad, existing.stockMax);
    unique.set(id, existing);
  }

  return Array.from(unique.values());
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitizeCartItems(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function buildNotice({ tone, text }) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    tone,
    text,
  };
}

function createItemFromProduct(product, quantity, stockMax) {
  const parsedPrice = Number(product.precio ?? product.price ?? 0);
  return {
    id: product.id,
    nombre: product.nombre ?? product.name,
    precio: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    imagen: product.imagenes?.[0] ?? product.image_url,
    categorySlug: product.categorySlug ?? product.category,
    cantidad: quantity,
    stockMax,
  };
}

function cartReducer(state, action) {
  switch (action.type) {
    case "add_item": {
      const product = action.product;
      if (!product?.id) {
        return {
          ...state,
          notice: buildNotice({ tone: "error", text: "No se pudo agregar el producto." }),
        };
      }

      const requestedQty = parsePositiveInt(action.quantity, 1);
      const stockMax = normalizeStockLimit(product.stockActual);

      if (stockMax <= 0) {
        return {
          ...state,
          notice: buildNotice({
            tone: "error",
            text: `${product.nombre ?? product.name ?? "Producto"} sin stock disponible.`,
          }),
        };
      }

      const index = state.items.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        const current = state.items[index];
        const currentMax = normalizeStockLimit(current.stockMax);
        const effectiveMax = Math.min(currentMax, stockMax);
        if (effectiveMax <= 0) {
          return {
            ...state,
            notice: buildNotice({
              tone: "error",
              text: `${current.nombre} sin stock disponible.`,
            }),
          };
        }
        const nextQty = Math.min(current.cantidad + requestedQty, effectiveMax);
        if (nextQty <= current.cantidad) {
          return {
            ...state,
            notice: buildNotice({
              tone: "warning",
              text: `Stock maximo alcanzado para ${current.nombre}.`,
            }),
          };
        }

        const delta = nextQty - current.cantidad;
        const nextItems = state.items.map((item, idx) =>
          idx === index ? { ...item, cantidad: nextQty, stockMax: effectiveMax } : item
        );
        const clipped = delta < requestedQty;

        return {
          ...state,
          items: nextItems,
          notice: buildNotice({
            tone: clipped ? "warning" : "success",
            text: clipped
              ? `Se agregaron ${delta} unidad(es) de ${current.nombre}. Stock maximo alcanzado.`
              : `Se agregaron ${delta} unidad(es) de ${current.nombre}.`,
          }),
        };
      }

      const firstQty = Math.min(requestedQty, stockMax);
      if (firstQty <= 0) {
        return {
          ...state,
          notice: buildNotice({
            tone: "error",
            text: `${product.nombre ?? product.name ?? "Producto"} sin stock disponible.`,
          }),
        };
      }

      const newItem = createItemFromProduct(product, firstQty, stockMax);
      const clipped = firstQty < requestedQty;

      return {
        ...state,
        items: [...state.items, newItem],
        notice: buildNotice({
          tone: clipped ? "warning" : "success",
          text: clipped
            ? `Se agregaron ${firstQty} unidad(es) de ${newItem.nombre}. Stock maximo alcanzado.`
            : `Agregado al carrito: ${newItem.nombre} x${firstQty}.`,
        }),
      };
    }

    case "update_qty": {
      const requestedQty = parsePositiveInt(action.quantity, 1);
      const nextItems = state.items.map((item) => {
        if (item.id !== action.productId) return item;
        const maxAllowed = normalizeStockLimit(item.stockMax);
        return {
          ...item,
          stockMax: maxAllowed,
          cantidad: Math.min(requestedQty, maxAllowed),
        };
      });

      return {
        ...state,
        items: nextItems,
      };
    }

    case "remove_item": {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.productId),
        notice: null,
      };
    }

    case "clear": {
      return {
        ...state,
        items: [],
        notice: null,
      };
    }

    case "dismiss_notice": {
      return {
        ...state,
        notice: null,
      };
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: loadCart(),
    notice: null,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  useEffect(() => {
    if (!state.notice) return undefined;
    const timer = window.setTimeout(() => {
      dispatch({ type: "dismiss_notice" });
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [state.notice]);

  const addItem = (product, quantity = 1) => {
    dispatch({ type: "add_item", product, quantity });
  };

  const updateQty = (productId, quantity) => {
    dispatch({ type: "update_qty", productId, quantity });
  };

  const removeItem = (productId) => {
    dispatch({ type: "remove_item", productId });
  };

  const clear = () => {
    dispatch({ type: "clear" });
  };

  const dismissNotice = () => {
    dispatch({ type: "dismiss_notice" });
  };

  const totalQty = useMemo(
    () => state.items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0),
    [state.items]
  );

  const totalAmount = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0),
        0
      ),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      addItem,
      updateQty,
      removeItem,
      clear,
      totalQty,
      totalAmount,
      cartNotice: state.notice,
      dismissCartNotice: dismissNotice,
    }),
    [state.items, totalQty, totalAmount, state.notice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
