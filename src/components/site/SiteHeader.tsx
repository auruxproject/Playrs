"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function SiteHeader() {
  const router = useRouter();
  const { ready, authenticated, login } = useAuth();

  const handleEnter = () => {
    if (authenticated) router.push("/dashboard");
    else login();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue/10 border border-blue/30 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
              <defs>
                <linearGradient id="sh-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#00D68F" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" stroke="url(#sh-lg)" strokeWidth="5" strokeDasharray="16 8" />
              <polygon points="50,25 70,38 70,62 50,75 30,62 30,38" fill="url(#sh-lg)" opacity="0.85" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-widest uppercase text-text-primary">Playrs</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/market"
            className="hidden sm:inline-block px-4 py-2 rounded-xl bg-background-secondary border border-border text-text-primary text-sm font-bold hover:border-blue/40 transition-all"
          >
            Ver mercado
          </Link>
          <button
            onClick={handleEnter}
            disabled={!ready}
            className="px-4 py-2 rounded-xl bg-blue text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue cursor-pointer disabled:opacity-60"
          >
            {authenticated ? "Ir a la App" : "Entrar"}
          </button>
        </div>
      </div>
    </header>
  );
}
