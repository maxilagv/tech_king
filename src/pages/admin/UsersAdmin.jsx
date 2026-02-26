import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/api/firebase";
import { createEmployeeUser, saveAdminUserProfile } from "@/api/adminUsers";
import { useAuth } from "@/hooks/useAuth";
import { EMPLOYEE_MODULE_IDS, normalizeAdminModules } from "@/constants/adminAccess";

function getTimeValue(ts) {
  if (!ts) return 0;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

function formatDateTime(ts) {
  const timeValue = getTimeValue(ts);
  if (!timeValue) return "-";
  return new Date(timeValue).toLocaleString();
}

function normalizeEmployeeModules(modules) {
  return normalizeAdminModules(modules).filter((moduleId) => EMPLOYEE_MODULE_IDS.includes(moduleId));
}

const moduleLabels = {
  products: "Productos",
  categories: "Categorias",
  offers: "Ofertas",
  customers: "Clientes",
  orders: "Pedidos",
  remitos: "Remitos",
};

function buildInitialCreateForm() {
  return {
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    modules: [...EMPLOYEE_MODULE_IDS],
  };
}

export default function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState(buildInitialCreateForm);
  const [editingId, setEditingId] = useState("");
  const [editingForm, setEditingForm] = useState({ displayName: "", modules: [], active: true });
  const [employeesQuery, setEmployeesQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setUsers([]);
      setLoading(false);
      setError("Firebase no esta configurado.");
      return () => {};
    }

    const ref = collection(db, "admin_users");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt));
        setUsers(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError?.message || "No se pudo cargar usuarios.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const employees = useMemo(
    () => users.filter((adminUser) => adminUser.role === "employee"),
    [users]
  );

  const superAdmins = useMemo(
    () => users.filter((adminUser) => adminUser.role === "super_admin"),
    [users]
  );

  const filteredEmployees = useMemo(() => {
    const query = employeesQuery.trim().toLowerCase();
    return employees.filter((adminUser) => {
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "active" && adminUser.active !== false) ||
        (statusFilter === "inactive" && adminUser.active === false);
      if (!statusOk) return false;
      if (!query) return true;
      const text = `${adminUser.displayName || ""} ${adminUser.email || ""} ${adminUser.id || ""}`
        .toLowerCase()
        .trim();
      return text.includes(query);
    });
  }, [employees, employeesQuery, statusFilter]);

  const handleCreateModuleToggle = (moduleId) => {
    setCreateForm((prev) => {
      const exists = prev.modules.includes(moduleId);
      const nextModules = exists
        ? prev.modules.filter((id) => id !== moduleId)
        : [...prev.modules, moduleId];
      return { ...prev, modules: normalizeEmployeeModules(nextModules) };
    });
  };

  const handleEditingModuleToggle = (moduleId) => {
    setEditingForm((prev) => {
      const exists = prev.modules.includes(moduleId);
      const nextModules = exists
        ? prev.modules.filter((id) => id !== moduleId)
        : [...prev.modules, moduleId];
      return { ...prev, modules: normalizeEmployeeModules(nextModules) };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const email = createForm.email.trim().toLowerCase();
    const displayName = createForm.displayName.trim();
    const password = String(createForm.password || "");
    const confirmPassword = String(createForm.confirmPassword || "");
    const modules = normalizeEmployeeModules(createForm.modules);
    if (!email || !password || modules.length === 0) {
      setError("Completa email, contrasena y al menos un modulo.");
      return;
    }
    if (!email.includes("@")) {
      setError("El email no es valido.");
      return;
    }
    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("La confirmacion de contrasena no coincide.");
      return;
    }

    setSaving(true);
    try {
      await createEmployeeUser({
        email,
        password,
        displayName,
        modules,
        createdBy: user?.uid || "system",
      });
      setCreateForm(buildInitialCreateForm());
      setMessage("Empleado creado correctamente.");
    } catch (createError) {
      setError(createError?.message || "No se pudo crear el empleado.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (adminUser) => {
    setEditingId(adminUser.id);
    setEditingForm({
      displayName: adminUser.displayName || "",
      modules: normalizeEmployeeModules(adminUser.modules || []),
      active: adminUser.active !== false,
    });
  };

  const closeEdit = () => {
    setEditingId("");
    setEditingForm({ displayName: "", modules: [], active: true });
  };

  const buildWritableEmployeePayload = (adminUser, overrides = {}) => {
    const modules = normalizeEmployeeModules(overrides.modules ?? adminUser.modules ?? []);
    const payload = {
      email: String(adminUser.email || "").trim().toLowerCase(),
      displayName: String(overrides.displayName ?? adminUser.displayName ?? "").trim(),
      role: "employee",
      modules,
      active: Boolean(overrides.active ?? (adminUser.active !== false)),
      createdBy: String(adminUser.createdBy || user?.uid || "legacy"),
      createdAt: adminUser.createdAt || serverTimestamp(),
    };
    if (adminUser.lastLoginAt) {
      payload.lastLoginAt = adminUser.lastLoginAt;
    }
    return payload;
  };

  const handleSaveEdit = async (adminUser) => {
    setMessage("");
    setError("");

    const modules = normalizeEmployeeModules(editingForm.modules);
    if (modules.length === 0) {
      setError("El empleado debe tener al menos un modulo habilitado.");
      return;
    }

    setSaving(true);
    try {
      await saveAdminUserProfile(
        adminUser.id,
        buildWritableEmployeePayload(adminUser, {
          displayName: editingForm.displayName,
          modules,
          active: editingForm.active,
        })
      );
      closeEdit();
      setMessage("Empleado actualizado.");
    } catch (saveError) {
      setError(saveError?.message || "No se pudo actualizar el empleado.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (adminUser) => {
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await saveAdminUserProfile(
        adminUser.id,
        buildWritableEmployeePayload(adminUser, {
          active: adminUser.active === false,
        })
      );
      setMessage(adminUser.active === false ? "Empleado activado." : "Empleado desactivado.");
    } catch (toggleError) {
      setError(toggleError?.message || "No se pudo cambiar el estado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Usuarios</p>
          <h2 className="text-2xl font-semibold mt-2">Registrar empleado</h2>
          <p className="text-sm text-white/60 mt-2">
            Crea credenciales para el panel admin y asigna los modulos permitidos.
          </p>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Usuario (email)</span>
              <input
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="empleado@techking.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Nombre</span>
              <input
                type="text"
                value={createForm.displayName}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="Nombre del empleado"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Contrasena inicial</span>
            <input
              type="password"
              value={createForm.password}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, password: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="Minimo 6 caracteres"
              minLength={6}
              required
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">
              Confirmar contrasena
            </span>
            <input
              type="password"
              value={createForm.confirmPassword}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="Repite la contrasena"
              minLength={6}
              required
            />
          </label>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60 mb-3">Modulos permitidos</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {EMPLOYEE_MODULE_IDS.map((moduleId) => (
                <label
                  key={moduleId}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={createForm.modules.includes(moduleId)}
                    onChange={() => handleCreateModuleToggle(moduleId)}
                    className="accent-cyan-400"
                  />
                  <span>{moduleLabels[moduleId] || moduleId}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase disabled:opacity-60"
          >
            {saving ? "Creando..." : "Crear empleado"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Empleados</p>
            <h2 className="text-2xl font-semibold mt-2">Accesos administrativos</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={employeesQuery}
              onChange={(event) => setEmployeesQuery(event.target.value)}
              placeholder="Buscar por nombre, email o UID"
              className="w-full sm:w-72 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-white/60 mt-3">{filteredEmployees.length} empleado(s)</p>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando usuarios...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-sm text-white/50">
            No hay empleados registrados para ese filtro.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredEmployees.map((adminUser) => {
              const isEditing = editingId === adminUser.id;
              return (
                <div
                  key={adminUser.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{adminUser.displayName || "Sin nombre"}</p>
                      <p className="text-xs text-white/50">{adminUser.email}</p>
                      <p className="text-[11px] text-white/40">
                        Alta: {formatDateTime(adminUser.createdAt)}
                      </p>
                      <p className="text-[11px] text-white/40">
                        Ultimo login: {formatDateTime(adminUser.lastLoginAt)}
                      </p>
                      <p className="text-[11px] text-white/40">UID: {adminUser.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] ${
                          adminUser.active === false
                            ? "bg-red-500/20 text-red-200"
                            : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {adminUser.active === false ? "Inactivo" : "Activo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(adminUser)}
                        disabled={saving}
                        className="px-3 py-2 rounded-2xl border border-white/15 text-xs uppercase tracking-[0.2em] hover:bg-white/10 disabled:opacity-60"
                      >
                        {adminUser.active === false ? "Activar" : "Desactivar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => (isEditing ? closeEdit() : openEdit(adminUser))}
                        className="px-3 py-2 rounded-2xl border border-cyan-400/40 text-cyan-200 text-xs uppercase tracking-[0.2em] hover:bg-cyan-500/10"
                      >
                        {isEditing ? "Cerrar" : "Editar"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {normalizeEmployeeModules(adminUser.modules || []).map((moduleId) => (
                      <span
                        key={`${adminUser.id}-${moduleId}`}
                        className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] bg-cyan-500/15 text-cyan-200"
                      >
                        {moduleLabels[moduleId] || moduleId}
                      </span>
                    ))}
                  </div>

                  {isEditing && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 space-y-3">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.25em] text-white/60">Nombre</span>
                        <input
                          type="text"
                          value={editingForm.displayName}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, displayName: event.target.value }))
                          }
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                        />
                      </label>

                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/60 mb-3">
                          Modulos permitidos
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {EMPLOYEE_MODULE_IDS.map((moduleId) => (
                            <label
                              key={`${adminUser.id}-${moduleId}-edit`}
                              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={editingForm.modules.includes(moduleId)}
                                onChange={() => handleEditingModuleToggle(moduleId)}
                                className="accent-cyan-400"
                              />
                              <span>{moduleLabels[moduleId] || moduleId}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editingForm.active}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, active: event.target.checked }))
                          }
                          className="accent-cyan-400"
                        />
                        Usuario activo
                      </label>

                      <button
                        type="button"
                        onClick={() => handleSaveEdit(adminUser)}
                        disabled={saving}
                        className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-xs font-semibold uppercase tracking-[0.2em] disabled:opacity-60"
                      >
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {superAdmins.length > 0 && (
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Super admins</p>
          <div className="mt-4 space-y-2">
            {superAdmins.map((adminUser) => (
              <div key={adminUser.id} className="text-sm text-white/70">
                {adminUser.displayName || adminUser.email || adminUser.id}
              </div>
            ))}
          </div>
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
    </div>
  );
}
