import { useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return typeof initial === "function" ? initial() : initial;
      return JSON.parse(stored);
    } catch {
      return typeof initial === "function" ? initial() : initial;
    }
  });

  const set = (newValue) => {
    setValue((prev) => {
      const next = typeof newValue === "function" ? newValue(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.warn(`localStorage write failed for "${key}":`, err);
      }
      return next;
    });
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== key) return;
      try {
        setValue(e.newValue ? JSON.parse(e.newValue) : initial);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, set];
}
