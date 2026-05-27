import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/api/firebase";
import { LANDING_HERO_FALLBACK_SLIDES } from "@/constants/brand";

const CACHE_KEY = "nexastore_heroes_v2";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Reads hero slides from localStorage cache (instant, no network).
 * Returns null if cache is missing, expired, or invalid.
 */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Saves hero slides to localStorage for instant next-visit load.
 */
function writeCache(data) {
  try {
    if (!Array.isArray(data) || data.length === 0) return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage can be unavailable (private mode, storage quota exceeded)
  }
}

export function useLandingHeroes(options = {}) {
  const { onlyActive = false } = options;

  // Priority:
  //   1. localStorage cache → instant, no Firestore delay (repeat visits)
  //   2. LANDING_HERO_FALLBACK_SLIDES → instant, from brand.js (first visit)
  //   3. Firestore snapshot → replaces state when data arrives
  const [heroes, setHeroes] = useState(() => {
    const cached = readCache();
    if (cached) return cached;
    // Return fallback slides synchronously so LCP image can start loading
    // before Firestore responds. Fallbacks are filtered/replaced once
    // Firestore data arrives.
    return LANDING_HERO_FALLBACK_SLIDES.map((s) => ({ ...s }));
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = collection(db, "landing_heroes");
    const q = query(ref, orderBy("orden", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        if (onlyActive) {
          items = items.filter((item) => item.activo !== false);
        }
        if (items.length > 0) {
          setHeroes(items);
          writeCache(items);
        }
        // If Firestore returns empty, keep showing fallbacks (don't blank the hero)
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError?.message || "No se pudo cargar la configuracion del hero.");
        setLoading(false);
        // On error, fallbacks are already showing — no action needed
      }
    );

    return () => unsubscribe();
  }, [onlyActive]);

  return { heroes, loading, error };
}
