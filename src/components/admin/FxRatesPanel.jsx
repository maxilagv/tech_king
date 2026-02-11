import React, { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useFxRates } from "@/hooks/useFxRates";
import { useAuth } from "@/hooks/useAuth";

export default function FxRatesPanel() {
  const { rates, loading } = useFxRates();
  const { user } = useAuth();
  const [form, setForm] = useState({ usdOficial: "", usdBlue: "", euro: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (rates) {
      setForm({
        usdOficial: rates.usdOficial ?? "",
        usdBlue: rates.usdBlue ?? "",
        euro: rates.euro ?? "",
      });
    }
  }, [rates]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await setDoc(
        doc(db, "config", "rates"),
        {
          usdOficial: Number(form.usdOficial || 0),
          usdBlue: Number(form.usdBlue || 0),
          euro: Number(form.euro || 0),
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || "system",
        },
        { merge: true }
      );
      setMessage("Cotizaciones actualizadas.");
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Cotizacion</p>
        <h2 className="text-2xl font-semibold mt-2">Tipo de cambio</h2>
      </div>

      {loading ? (
        <div className="text-sm text-white/50">Cargando cotizaciones...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">USD oficial</span>
            <input
              type="number"
              value={form.usdOficial}
              onChange={(event) => handleChange("usdOficial", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              min="0"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">USD blue</span>
            <input
              type="number"
              value={form.usdBlue}
              onChange={(event) => handleChange("usdBlue", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              min="0"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Euro</span>
            <input
              type="number"
              value={form.euro}
              onChange={(event) => handleChange("euro", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              min="0"
            />
          </label>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cotizaciones"}
      </button>
    </div>
  );
}
