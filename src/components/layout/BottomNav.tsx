"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  {
    href: "/dashboard",
    labelKey: "nav.home.short",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-blue" : "text-text-tertiary"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/market?tab=ipo",
    labelKey: "nav.ipo.short",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-blue" : "text-text-tertiary"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 8H4a2 2 0 110-4h8m0 4v6m0-6H20a2 2 0 100-4h-8"
        />
      </svg>
    ),
  },
  {
    href: "/market?tab=p2p",
    labelKey: "nav.p2p.short",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-blue" : "text-text-tertiary"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    href: "/bets",
    labelKey: "nav.bets.short",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-blue" : "text-text-tertiary"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: "/portfolio",
    labelKey: "nav.portfolio.short",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-blue" : "text-text-tertiary"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    labelKey: "nav.profile.short",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "text-blue" : "text-text-tertiary"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

// Inner component that uses useSearchParams — must be inside <Suspense>
function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const currentTab = searchParams.get("tab");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
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
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors relative"
            >
              {item.icon(isActive)}
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-blue" : "text-text-tertiary"
                }`}
              >
                {t(item.labelKey)}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue rounded-full shadow-glow-blue" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Public export — Suspense is embedded here so no call site needs to add it
export function BottomNav() {
  return (
    <Suspense fallback={
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border md:hidden h-[60px]" />
    }>
      <BottomNavInner />
    </Suspense>
  );
}
