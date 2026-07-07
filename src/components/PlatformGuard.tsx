"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Rutas de la PLATAFORMA que requieren sesión. Las de marketing (/, /niveles,
// /info/*, /legal/*) quedan públicas.
const PROTECTED_PREFIXES = ["/dashboard", "/market", "/portfolio", "/bets", "/profile"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Redirige a la landing (donde puede iniciar sesión) si un usuario sin sesión
 * intenta abrir una ruta de la plataforma directamente por URL. No bloquea el
 * render de las páginas públicas.
 */
export function PlatformGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!authenticated && isProtected(pathname)) {
      router.replace("/");
    } else if (authenticated && pathname === "/") {
      // El login es async (abre un modal); una vez se confirma, la app debe
      // llevar al usuario a la plataforma sin que tenga que hacer clic de nuevo.
      router.replace("/dashboard");
    }
  }, [ready, authenticated, pathname, router]);

  return <>{children}</>;
}
