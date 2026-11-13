import { useEffect, useState, useSyncExternalStore } from "react";
import { getCurrentUser, getVersion, getLoadError, initStore, subscribe, type Role } from "./store";

/** Re-renders on any ERA data change. `ready` is false during SSR/first paint (localStorage unavailable). */
export function useEra() {
  const v = useSyncExternalStore(
    (l) => {
      const un = subscribe(l);
      return () => void un();
    },
    getVersion,
    () => -1,
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initStore().catch(() => {}).finally(() => setReady(true));
  }, []);
  const user = ready ? getCurrentUser() : null;
  return { ready, user, v, error: getLoadError() };
}

export const homeFor = (role: Role) => (role === "provider" ? "/provider" : "/activities");

export function safeRedirect(r: unknown): string | null {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/login") && !r.startsWith("/signup") ? r : null;
}
