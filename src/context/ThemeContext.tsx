"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

// Apply class directly to <html> element
function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start as "light" — the HTML already has class="light" from layout.tsx
  const [theme, setTheme] = useState<Theme>("light");

  // On first mount: read localStorage and apply correct theme
  useEffect(() => {
    const stored = localStorage.getItem("vs-theme");
    const resolved: Theme = stored === "dark" ? "dark" : "light";
    // Apply to DOM immediately
    applyTheme(resolved);
    setTheme(resolved);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("vs-theme", next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
