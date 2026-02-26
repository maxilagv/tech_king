import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/api/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ALL_ADMIN_MODULE_IDS, normalizeAdminModules } from "@/constants/adminAccess";

const INITIAL_STATE = {
  checking: true,
  isAdmin: false,
  isSuperAdmin: false,
  role: null,
  modules: [],
  profile: null,
  error: "",
};

function buildAccessState({
  fallbackSuperAdmin,
  claimSuperAdmin,
  claimEmployee,
  claimModules,
  profile,
}) {
  const hasProfile = Boolean(profile);
  const profileExplicitlyDisabled = hasProfile && profile?.active === false;
  const profileActive = profile?.active !== false;
  const profileRole = profile?.role;
  const profileModules = profileActive ? normalizeAdminModules(profile?.modules) : [];

  const profileSuperAdmin = profileActive && profileRole === "super_admin";
  const isSuperAdmin = fallbackSuperAdmin || claimSuperAdmin || profileSuperAdmin;

  if (isSuperAdmin) {
    return {
      checking: false,
      isAdmin: true,
      isSuperAdmin: true,
      role: "super_admin",
      modules: ALL_ADMIN_MODULE_IDS,
      profile,
      error: "",
    };
  }

  const profileEmployee = profileActive && profileRole === "employee" && profileModules.length > 0;
  const claimEmployeeAccess = !profileExplicitlyDisabled && claimEmployee && claimModules.length > 0;

  if (profileEmployee || claimEmployeeAccess) {
    return {
      checking: false,
      isAdmin: true,
      isSuperAdmin: false,
      role: "employee",
      modules: profileEmployee ? profileModules : claimModules,
      profile,
      error: "",
    };
  }

  return {
    checking: false,
    isAdmin: false,
    isSuperAdmin: false,
    role: null,
    modules: [],
    profile,
    error: "",
  };
}

export function useAdminAccess() {
  const { user, loading } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    if (loading) return () => {};

    if (!user) {
      setState({
        ...INITIAL_STATE,
        checking: false,
      });
      return () => {};
    }

    const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const adminUid = String(import.meta.env.VITE_ADMIN_UID || "").trim();
    const fallbackSuperAdmin =
      Boolean(adminEmail) && String(user.email || "").toLowerCase() === adminEmail
        ? true
        : Boolean(adminUid) && user.uid === adminUid;

    let active = true;
    let unsubscribe = null;

    const startAccessSync = (tokenInfo) => {
      const claimSuperAdmin = tokenInfo?.claimSuperAdmin === true;
      const claimEmployee = tokenInfo?.claimEmployee === true;
      const claimModules = normalizeAdminModules(tokenInfo?.claimModules || []);

      if (!isFirebaseConfigured || !db) {
        if (!active) return;
        setState(
          buildAccessState({
            fallbackSuperAdmin,
            claimSuperAdmin,
            claimEmployee,
            claimModules,
            profile: null,
          })
        );
        return;
      }

      const accessRef = doc(db, "admin_users", user.uid);
      unsubscribe = onSnapshot(
        accessRef,
        (snapshot) => {
          if (!active) return;
          const profile = snapshot.exists() ? snapshot.data() : null;
          setState(
            buildAccessState({
              fallbackSuperAdmin,
              claimSuperAdmin,
              claimEmployee,
              claimModules,
              profile,
            })
          );
        },
        (error) => {
          if (!active) return;
          setState((prev) => ({
            ...buildAccessState({
              fallbackSuperAdmin,
              claimSuperAdmin,
              claimEmployee,
              claimModules,
              profile: null,
            }),
            error: error?.message || "No se pudo validar permisos administrativos.",
          }));
        }
      );
    };

    user
      .getIdTokenResult()
      .then((result) => {
        if (!active) return;
        startAccessSync({
          claimSuperAdmin: result?.claims?.admin === true || result?.claims?.role === "super_admin",
          claimEmployee: result?.claims?.role === "employee",
          claimModules: result?.claims?.modules,
        });
      })
      .catch(() => {
        if (!active) return;
        startAccessSync({
          claimSuperAdmin: false,
          claimEmployee: false,
          claimModules: [],
        });
      });

    return () => {
      active = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user, loading]);

  const canAccessModule = useMemo(
    () => (moduleId) => {
      if (state.isSuperAdmin) return true;
      return state.modules.includes(moduleId);
    },
    [state.isSuperAdmin, state.modules]
  );

  return {
    user,
    authLoading: loading,
    ...state,
    canAccessModule,
  };
}
