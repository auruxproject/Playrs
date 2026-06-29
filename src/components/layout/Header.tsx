"use client";

import { useTheme } from "@/context/ThemeContext";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, type Lang } from "@/lib/i18n";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}

export function Header({
  title = "Playrs",
  showBack = false,
  onBack,
  rightActions,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { userAvatar, setIsProfileOpen } = useStore();
  const { lang, setLang, t } = useLanguage();

  const cycleLang = () => {
    const idx = LANGUAGES.findIndex((l) => l.code === lang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLang(next.code as Lang);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-background-tertiary transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {rightActions && <div className="mr-1">{rightActions}</div>}

          {/* ── Theme Toggle ── */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            title={theme === "light" ? "Activar Modo Oscuro" : "Activar Modo Claro"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border hover:border-blue/40 bg-background-tertiary hover:bg-background-secondary transition-all duration-200 cursor-pointer group"
          >
            {theme === "light" ? (
              <>
                <svg className="w-4 h-4 text-text-secondary group-hover:text-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-[10px] font-bold text-text-secondary group-hover:text-blue transition-colors hidden sm:block">
                  {t("header.dark")}
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-[10px] font-bold text-gold hidden sm:block">
                  {t("header.light")}
                </span>
              </>
            )}
          </button>

          {/* ── Language Selector ── */}
          <button
            onClick={cycleLang}
            aria-label={t("header.lang_aria")}
            title={t("header.lang_aria")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border hover:border-blue/40 bg-background-tertiary hover:bg-background-secondary transition-all duration-200 cursor-pointer group"
          >
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span className="text-[10px] font-bold font-mono text-text-secondary group-hover:text-blue transition-colors">
              {lang.toUpperCase()}
            </span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-background-tertiary transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red rounded-full" />
          </button>

          {/* Avatar */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-1.5 rounded-xl hover:bg-background-tertiary transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-sm shadow-inner">
              {userAvatar}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
