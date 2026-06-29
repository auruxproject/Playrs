"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useStore } from "@/context/StoreContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, type Lang } from "@/lib/i18n";

const navItems = [
  {
    href: "/",
    labelKey: "nav.home",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-blue" : "text-text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/market?tab=ipo",
    labelKey: "nav.ipo",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-blue" : "text-text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 8H4a2 2 0 110-4h8m0 4v6m0-6H20a2 2 0 100-4h-8" />
      </svg>
    ),
  },
  {
    href: "/market?tab=p2p",
    labelKey: "nav.p2p",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-blue" : "text-text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    href: "/bets",
    labelKey: "nav.bets",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-blue" : "text-text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/portfolio",
    labelKey: "nav.portfolio",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-blue" : "text-text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: "/profile",
    labelKey: "nav.profile",
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? "text-blue" : "text-text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// Inner component that uses useSearchParams — must be inside <Suspense>
function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const currentTab = searchParams.get("tab");

  return (
    <nav className="flex flex-col gap-1 text-sm font-medium">
      <span className="block text-[9px] text-text-tertiary tracking-widest uppercase font-bold mb-2 font-mono">
        {t("nav.section")}
      </span>

      {navItems.map((item) => {
        let isActive = false;
        if (item.href.includes("?tab=")) {
          const tab = item.href.split("=")[1];
          isActive = pathname === "/market" && currentTab === tab;
        } else {
          isActive = pathname === item.href;
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-background-tertiary border border-border text-text-primary shadow-subtle font-semibold"
                : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary/50 border border-transparent"
            }`}
          >
            {item.icon(isActive)}
            <span>{t(item.labelKey)}</span>
            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 bg-blue rounded-full shadow-glow-blue" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// SidebarContent has access to StoreContext and renders the full sidebar shell
function SidebarContent() {
  const { balance, simulateMatchDay, userTier, username, userAvatar, setIsProfileOpen } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const tierLabels = {
    standard: "ESTÁNDAR",
    silver: "PLATA",
    gold: "ORO VIP",
    diamond: "DIAMANTE VIP",
    legend: "LEYENDA ELITE"
  };

  const tierGlow = {
    standard: "",
    silver: "",
    gold: "hover:shadow-glow-gold/10 hover:border-amber-500/40",
    diamond: "hover:shadow-glow-blue/10 hover:border-cyan-500/40",
    legend: "hover:shadow-glow-purple/20 hover:border-pink-500/40 animate-pulse-slow"
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-background-secondary border-r border-border shrink-0 z-40 justify-between font-sans shadow-strong">
      <div className="p-5 space-y-6">
        {/* Logo and Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue/10 border border-blue/30 rounded-xl flex items-center justify-center shadow-glow-blue">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 animate-pulse-slow">
              <defs>
                <linearGradient id="logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#00D68F" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" stroke="url(#logo-glow)" strokeWidth="4" strokeDasharray="16 8" />
              <polygon points="50,25 70,38 70,62 50,75 30,62 30,38" fill="url(#logo-glow)" opacity="0.8" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-sans font-black tracking-widest text-text-primary block uppercase">
              {t("app.name")}
            </span>
            <span className="block text-[8px] tracking-[0.2em] uppercase text-blue font-mono font-bold">
              {t("app.tagline")}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="bg-background-tertiary border border-border/50 px-3 py-2 rounded-xl flex items-center justify-between text-[10px] font-mono-nums text-text-secondary">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 bg-green shadow-glow-green rounded-full animate-pulse" />
            {t("sidebar.connection")}
          </span>
          <span className="text-text-tertiary">V1.0</span>
        </div>

        {/* User Card */}
        <div
          onClick={() => setIsProfileOpen(true)}
          className={`bg-gradient-to-br from-background-tertiary to-background-secondary border border-border rounded-2xl p-4 shadow-subtle space-y-3 relative overflow-hidden group cursor-pointer hover:bg-background-tertiary/80 transition-all duration-300 select-none ${tierGlow[userTier]}`}
        >
          <div className="absolute right-0 top-0 w-20 h-20 bg-blue/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue/15 border border-blue/30 flex items-center justify-center text-lg shadow-inner">
              {userAvatar}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-text-primary truncate">
                {username}
              </span>
              <span className={`inline-block text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                userTier === "legend" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                userTier === "diamond" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                userTier === "gold" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                userTier === "silver" ? "bg-slate-400/20 text-slate-300 border border-slate-400/30" :
                "bg-blue/10 text-blue border border-blue/20"
              }`}>
                {tierLabels[userTier]}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="block text-[8px] uppercase tracking-widest text-text-tertiary font-mono">
              {t("sidebar.balance")}
            </span>
            <span className="text-lg font-bold font-mono-nums text-green block mt-0.5 tracking-tight">
              ${balance.toFixed(2)} <span className="text-xs font-normal text-text-secondary">USDC</span>
            </span>
          </div>
        </div>

        {/* Menu Navigation Links — wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="h-40 animate-pulse bg-background-tertiary/30 rounded-xl" />}>
          <SidebarNav />
        </Suspense>
      </div>

      {/* Bottom Panel: Language + Theme + Simulate */}
      <div className="p-5 border-t border-border bg-background-tertiary/20 space-y-3">
        <div>
          <span className="block text-[9px] text-text-tertiary tracking-widest uppercase font-bold font-mono">
            {t("sidebar.simulator")}
          </span>
          <p className="text-[10px] text-text-secondary mt-1">{t("sidebar.simulator.desc")}</p>
        </div>

        {/* Language Selector */}
        <div>
          <span className="block text-[9px] text-text-tertiary tracking-widest uppercase font-bold font-mono mb-1.5">
            {t("sidebar.language")}
          </span>
          <div className="flex gap-1">
            {LANGUAGES.map(({ code, flag, name }) => (
              <button
                key={code}
                onClick={() => setLang(code as Lang)}
                title={name}
                className={`flex-1 py-2 rounded-lg text-[9px] font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  lang === code
                    ? "bg-blue text-white shadow-glow-blue"
                    : "bg-background-secondary border border-border text-text-tertiary hover:border-blue/40 hover:text-text-secondary"
                }`}
              >
                {flag} {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-background-secondary border border-border hover:border-blue/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            {theme === "light" ? (
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            <span className="text-xs font-bold text-text-secondary">
              {theme === "light" ? t("sidebar.dark") : t("sidebar.light")}
            </span>
          </div>
          {/* Toggle pill */}
          <div className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
            theme === "dark" ? "bg-blue" : "bg-border"
          }`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
              theme === "dark" ? "left-5" : "left-0.5"
            }`} />
          </div>
        </button>

        <button
          onClick={simulateMatchDay}
          className="w-full flex items-center justify-center gap-2 bg-gradient-primary text-white font-bold text-xs py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-glow-blue cursor-pointer"
        >
          <span>⚽</span>
          <span>{t("sidebar.simulate")}</span>
        </button>
      </div>
    </aside>
  );
}

// Public export — no Suspense needed at the call site
export function Sidebar() {
  return <SidebarContent />;
}
