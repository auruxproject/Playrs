"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, type Lang } from "@/lib/i18n";

export function SiteHeader() {
  const router = useRouter();
  const { ready, authenticated, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const handleEnter = () => {
    if (authenticated) router.push("/dashboard");
    else login();
  };

  const cycleLang = () => {
    const idx = LANGUAGES.findIndex((l) => l.code === lang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLang(next.code as Lang);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

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
          <button
            onClick={() => (authenticated ? router.push("/market") : login())}
            disabled={!ready}
            className="hidden sm:inline-block px-4 py-2 rounded-xl bg-background-secondary border border-border text-text-primary text-sm font-bold hover:border-blue/40 transition-all cursor-pointer disabled:opacity-60"
          >
            Ver mercado
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            title={theme === "light" ? "Activar Modo Oscuro" : "Activar Modo Claro"}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border hover:border-blue/40 bg-background-tertiary hover:bg-background-secondary transition-all duration-200 cursor-pointer group"
          >
            {theme === "light" ? (
              <svg className="w-4 h-4 text-text-secondary group-hover:text-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* Language Selector */}
          <button
            onClick={cycleLang}
            aria-label={t("header.lang_aria")}
            title={t("header.lang_aria")}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-border hover:border-blue/40 bg-background-tertiary hover:bg-background-secondary transition-all duration-200 cursor-pointer group"
          >
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span className="text-[10px] font-bold font-mono text-text-secondary group-hover:text-blue transition-colors">
              {lang.toUpperCase()}
            </span>
          </button>

          <button
            onClick={handleEnter}
            disabled={!ready}
            className="px-4 py-2 rounded-xl bg-blue text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue cursor-pointer disabled:opacity-60"
          >
            {authenticated ? "Ir a la App" : "Entrar / Registrarse"}
          </button>
        </div>
      </div>
    </header>
  );
}
