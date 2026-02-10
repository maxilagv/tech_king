import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/api/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Mail, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const redirectTo = location.state?.from?.pathname || "/admin";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError("Credenciales invalidas o sin permisos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 right-10 w-[480px] h-[480px] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[-120px] w-[520px] h-[520px] rounded-full bg-blue-500/20 blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs tracking-[0.3em] uppercase">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            Acceso seguro
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Panel administrativo
            <span className="block text-cyan-300">Tech King</span>
          </h1>
          <p className="text-white/60 text-base max-w-md">
            Controla productos, categorias, clientes, pedidos, stock, finanzas y remitos desde un
            solo lugar. Accede con tu cuenta de administrador.
          </p>
          <div className="flex gap-4 text-xs text-white/50 uppercase tracking-[0.25em]">
            <span>ABM</span>
            <span>Stock</span>
            <span>Finanzas</span>
            <span>Remitos</span>
          </div>
        </div>

        <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50">Ingresar</p>
            <h2 className="text-2xl font-semibold">Bienvenido de vuelta</h2>
            <p className="text-sm text-white/50 mt-2">Usa tu email de administrador.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Email</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <Mail className="w-4 h-4 text-cyan-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@techking.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Contrasena</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <Lock className="w-4 h-4 text-cyan-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                  required
                />
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
