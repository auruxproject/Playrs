"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

interface InfoPageProps {
  badge?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Oculta el bloque CTA final */
  hideCta?: boolean;
}

export function InfoPage({ badge, icon, title, subtitle, children, hideCta }: InfoPageProps) {
  const router = useRouter();
  const { authenticated, login } = useAuth();

  const handleEnter = () => {
    if (authenticated) router.push("/dashboard");
    else login();
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-8">
          <Link href="/" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">← Volver al inicio</Link>
          {(badge || icon) && (
            <div className="flex items-center gap-3 mt-6 mb-4">
              {icon && <span className="text-4xl">{icon}</span>}
              {badge && (
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue bg-blue/10 border border-blue/20 px-3 py-1.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary leading-[1.1]">{title}</h1>
          {subtitle && <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed">{subtitle}</p>}
        </div>
      </section>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-5 pb-10 space-y-6 text-text-secondary leading-relaxed">
        {children}
      </article>

      {/* CTA */}
      {!hideCta && (
        <section className="max-w-3xl mx-auto px-5 py-10">
          <div className="relative bg-gradient-to-br from-blue/15 to-green/10 border border-blue/20 rounded-3xl p-8 text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-xl sm:text-2xl font-black text-text-primary mb-2">¿List@ para jugar?</h2>
            <p className="text-text-secondary mb-6 text-sm">Crea tu cuenta gratis y empieza a construir tu plantilla.</p>
            <button
              onClick={handleEnter}
              className="inline-block px-7 py-3 rounded-xl bg-gradient-to-r from-blue to-green text-white text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue cursor-pointer"
            >
              {authenticated ? "Ir a la App →" : "Empezar gratis →"}
            </button>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

/* Helpers de contenido reutilizables */
export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-background-secondary border border-border rounded-2xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-2">{title}</h2>
      <div className="text-sm text-text-secondary leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export function ComingSoon() {
  return (
    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded ml-2">
      Próximamente
    </span>
  );
}
