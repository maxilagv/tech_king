import React, { useMemo, useState } from "react";
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

export default function Checkout() {
  const { user } = useAuth();
  const { profile } = useCustomerProfile(user);
  const { items, totalAmount, clear, updateQty, removeItem } = useCart();
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

  const canCheckout = items.length > 0 && user;

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
    if (!items.length) {
      setError("El carrito esta vacio.");
      return;
    }
    if (!user) {
      setError("Debes iniciar sesion.");
      return;
    }
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
      }));

      await addDoc(collection(db, "orders"), {
        customerId: user.uid,
        items: orderItems,
        total: Number(totalAmount.toFixed(2)),
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
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Checkout</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#0A0A0A] mt-2">
              Finaliza tu compra
            </h1>
          </div>

          {!user ? (
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg">
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setMode("login")}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] ${
                    mode === "login" ? "bg-blue-600 text-white" : "bg-black/5 text-black/60"
                  }`}
                >
                  Ingresar
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] ${
                    mode === "register" ? "bg-blue-600 text-white" : "bg-black/5 text-black/60"
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
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                    required
                  />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Contrasena"
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
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
                      className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={registerForm.apellido}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, apellido: event.target.value }))
                      }
                      placeholder="Apellido"
                      className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
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
                    className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={registerForm.direccion}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, direccion: event.target.value }))
                    }
                    placeholder="Direccion"
                    className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={registerForm.telefono}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, telefono: event.target.value }))
                    }
                    placeholder="Telefono"
                    className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                  />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="Email"
                    className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
                    required
                  />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Contrasena"
                    className="rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none"
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
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">Cuenta</p>
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
              <p className="text-sm text-black/60">
                Direccion: {profile?.direccion || "No informada"}
              </p>
              <p className="text-sm text-black/60">
                Telefono: {profile?.telefono || "No informado"}
              </p>
              {!profile && (
                <p className="text-sm text-red-500">
                  Falta completar el perfil. Vuelve a registrarte con tus datos.
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

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Resumen</p>
          <h2 className="text-2xl font-semibold mt-2">Tu pedido</h2>

          {items.length === 0 ? (
            <div className="py-10 text-sm text-black/50">No hay productos en el carrito.</div>
          ) : (
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b border-black/10 pb-4"
                >
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.nombre}</p>
                    <p className="text-xs text-black/50">${item.precio}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.id, Math.max(1, item.cantidad - 1))}
                        className="w-7 h-7 rounded-full border border-black/10 text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm">{item.cantidad}</span>
                      <button
                        onClick={() => updateQty(item.id, item.cantidad + 1)}
                        className="w-7 h-7 rounded-full border border-black/10 text-sm disabled:opacity-40"
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
                  </div>
                  <div className="text-sm font-semibold">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

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
