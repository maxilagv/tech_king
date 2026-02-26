import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/api/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { useCart } from "@/context/CartContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import { getProductPricing } from "@/utils/offers";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, checking: checkingAdmin } = useAdminAccess();
  const { products } = useProducts({ onlyActive: true });
  const { offers } = useOffers({ onlyActive: true });
  const { profile } = useCustomerProfile(user);
  const { items, clear, updateQty, removeItem } = useCart();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    direccion: "",
    telefono: "",
    email: "",
    password: "",
  });

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product.id), product])),
    [products]
  );

  const pricedItems = useMemo(
    () =>
      items.map((item) => {
        const qty = Math.max(1, Number(item.cantidad || 1));
        const fallbackPrice = Number(item.precio || 0);
        const product = productMap.get(String(item.id));

        if (!product) {
          return {
            ...item,
            unitPrice: fallbackPrice,
            baseUnitPrice: fallbackPrice,
            hasOffer: false,
            pricing: null,
            lineTotal: Number((fallbackPrice * qty).toFixed(2)),
          };
        }

        const pricing = getProductPricing(product, offers, qty);
        return {
          ...item,
          unitPrice: pricing.finalPrice,
          baseUnitPrice: pricing.basePrice,
          hasOffer: pricing.hasOffer,
          pricing,
          lineTotal: Number((pricing.finalPrice * qty).toFixed(2)),
        };
      }),
    [items, offers, productMap]
  );

  const checkoutTotal = useMemo(
    () => pricedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [pricedItems]
  );

  const canCheckout = pricedItems.length > 0 && user && profile && !isAdmin && !checkingAdmin;

  const customerSnapshot = useMemo(() => {
    if (!profile) return null;
    return {
      nombre: profile.nombre || "",
      apellido: profile.apellido || "",
      dni: profile.dni || "",
      direccion: profile.direccion || "",
      telefono: profile.telefono || "",
      email: profile.email || user?.email || "",
    };
  }, [profile, user]);

  useEffect(() => {
    const desired = searchParams.get("mode");
    if (desired === "login" || desired === "register") {
      setMode(desired);
    }
  }, [searchParams]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (err) {
      setError("Credenciales invalidas.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        registerForm.email,
        registerForm.password
      );
      await setDoc(doc(db, "customers", credential.user.uid), {
        nombre: registerForm.nombre.trim(),
        apellido: registerForm.apellido.trim(),
        dni: registerForm.dni.trim(),
        direccion: registerForm.direccion.trim(),
        telefono: registerForm.telefono.trim(),
        email: registerForm.email.trim(),
        tipo: "cliente",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage("Cuenta creada correctamente.");
    } catch (err) {
      setError("No se pudo registrar. Verifica los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setError("");
    setMessage("");
    if (!pricedItems.length) {
      setError("El carrito esta vacio.");
      return;
    }
    if (!user) {
      setError("Debes iniciar sesion.");
      return;
    }
    if (!profile) {
      setError("Debes completar tu registro para comprar.");
      return;
    }
    if (isAdmin) {
      setError("La cuenta de administrador no puede comprar desde la tienda.");
      return;
    }
    setLoading(true);
    try {
      const orderItems = pricedItems.map((item) => ({
        productId: item.id,
        nombre: item.nombre,
        precio: Number(item.unitPrice.toFixed(2)),
        cantidad: item.cantidad,
      }));

      await addDoc(collection(db, "orders"), {
        customerId: user.uid,
        items: orderItems,
        total: Number(checkoutTotal.toFixed(2)),
        status: "pendiente",
        source: "web",
        stockApplied: false,
        financeApplied: false,
        customerSnapshot: customerSnapshot || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clear();
      setMessage("Pedido generado. Te contactaremos para confirmar.");
    } catch (err) {
      setError("No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen tk-theme-bg pt-28 pb-20 px-6 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Checkout</p>
            <h1 className="text-3xl md:text-4xl font-semibold tk-theme-text mt-2">
              Finaliza tu compra
            </h1>
          </div>

          {!user ? (
            <div className="rounded-3xl border tk-theme-border tk-theme-surface p-6 shadow-lg">
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setMode("login")}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] ${
                    mode === "login" ? "bg-blue-600 text-white" : "bg-[var(--tk-field-bg)] tk-theme-muted"
                  }`}
                >
                  Ingresar
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] ${
                    mode === "register" ? "bg-blue-600 text-white" : "bg-[var(--tk-field-bg)] tk-theme-muted"
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="Email"
                    className="w-full rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                    required
                  />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Contrasena"
                    className="w-full rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-blue-600 text-white py-3 text-sm font-semibold uppercase tracking-[0.2em]"
                  >
                    {loading ? "Ingresando..." : "Ingresar"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={registerForm.nombre}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, nombre: event.target.value }))
                      }
                      placeholder="Nombre"
                      className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                      required
                    />
                    <input
                      type="text"
                      value={registerForm.apellido}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, apellido: event.target.value }))
                      }
                      placeholder="Apellido"
                      className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    value={registerForm.dni}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, dni: event.target.value }))
                    }
                    placeholder="DNI"
                    className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                  />
                  <input
                    type="text"
                    value={registerForm.direccion}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, direccion: event.target.value }))
                    }
                    placeholder="Direccion"
                    className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                  />
                  <input
                    type="text"
                    value={registerForm.telefono}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, telefono: event.target.value }))
                    }
                    placeholder="Telefono"
                    className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                  />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="Email"
                    className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                    required
                  />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Contrasena"
                    className="rounded-2xl border tk-theme-border tk-theme-surface px-4 py-3 text-sm outline-none tk-theme-text"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-blue-600 text-white py-3 text-sm font-semibold uppercase tracking-[0.2em]"
                  >
                    {loading ? "Creando..." : "Crear cuenta"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border tk-theme-border tk-theme-surface p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] tk-theme-muted">Cuenta</p>
                  <h2 className="text-lg font-semibold">
                    {profile ? `${profile.nombre} ${profile.apellido}` : user.email}
                  </h2>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="text-xs uppercase tracking-[0.2em] text-blue-600"
                >
                  Cerrar sesion
                </button>
              </div>
              <p className="text-sm tk-theme-muted">
                Direccion: {profile?.direccion || "No informada"}
              </p>
              <p className="text-sm tk-theme-muted">
                Telefono: {profile?.telefono || "No informado"}
              </p>
              {!profile && (
                <p className="text-sm text-red-500">
                  Falta completar el perfil. Registrate con tus datos para poder comprar.
                </p>
              )}
              {isAdmin && (
                <p className="text-sm text-red-500">
                  Estas logueado como administrador. Cerra sesion para comprar.
                </p>
              )}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-3xl border tk-theme-border tk-theme-surface p-6 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] tk-theme-muted">Resumen</p>
          <h2 className="text-2xl font-semibold mt-2">Tu pedido</h2>

          {pricedItems.length === 0 ? (
            <div className="py-10 text-sm tk-theme-muted">No hay productos en el carrito.</div>
          ) : (
            <div className="mt-6 space-y-4">
              {pricedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b tk-theme-border pb-4"
                >
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.nombre}</p>
                    {item.hasOffer ? (
                      <div className="space-y-0.5">
                        <p className="text-xs tk-theme-text font-semibold">
                          ${Number(item.unitPrice || 0).toFixed(2)} c/u
                        </p>
                        <p className="text-[11px] tk-theme-muted line-through">
                          ${Number(item.baseUnitPrice || 0).toFixed(2)} lista
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs tk-theme-muted">
                        ${Number(item.unitPrice || 0).toFixed(2)} c/u
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.id, Math.max(1, item.cantidad - 1))}
                        className="w-7 h-7 rounded-full border tk-theme-border text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm">{item.cantidad}</span>
                      <button
                        onClick={() => updateQty(item.id, item.cantidad + 1)}
                        className="w-7 h-7 rounded-full border tk-theme-border text-sm disabled:opacity-40"
                        disabled={item.stockMax !== undefined && item.cantidad >= item.stockMax}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-red-500 ml-2"
                      >
                        Quitar
                      </button>
                    </div>
                    {item.pricing?.volumeHintMinUnits && !item.pricing?.hasOffer && (
                      <p className="text-[11px] text-blue-600 mt-1">
                        Mejora desde {item.pricing.volumeHintMinUnits} unidades.
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-semibold">
                    ${Number(item.lineTotal || 0).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${checkoutTotal.toFixed(2)}</span>
              </div>

              {!user && (
                <p className="text-xs text-red-500">
                  Debes iniciar sesion o registrarte para confirmar tu pedido.
                </p>
              )}
              {user && !profile && (
                <p className="text-xs text-red-500">
                  Completa tu registro para poder comprar.
                </p>
              )}
              {isAdmin && (
                <p className="text-xs text-red-500">
                  La cuenta admin no puede comprar desde la tienda.
                </p>
              )}
              <button
                onClick={handleCheckout}
                disabled={!canCheckout || loading}
                className="w-full rounded-2xl bg-blue-600 text-white py-3 text-sm font-semibold uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar pedido"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
