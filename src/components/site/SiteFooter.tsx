"use client";

import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/info/mercado", label: "Mercado" },
  { href: "/info/oraculo", label: "Oráculo" },
  { href: "/info/duelos", label: "Duelos" },
  { href: "/info/forja", label: "Forja" },
  { href: "/info/wallet", label: "Wallet Solana" },
  { href: "/niveles", label: "Niveles" },
];

const LEGAL_LINKS = [
  { href: "/legal/terminos", label: "Términos de uso" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/transparencia", label: "Transparencia" },
  { href: "/legal/descargo", label: "Descargo de responsabilidad" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-black tracking-widest uppercase text-text-primary">Playrs</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Fantasy trading sintético basado en el rendimiento real de futbolistas. Entretenimiento, no asesoría financiera.
            </p>
          </div>

          {/* Producto */}
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-tertiary font-bold font-mono mb-3">Producto</span>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-text-secondary hover:text-text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-tertiary font-bold font-mono mb-3">Legal</span>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-text-secondary hover:text-text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App */}
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-text-tertiary font-bold font-mono mb-3">Plataforma</span>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-xs text-text-secondary hover:text-text-primary transition-colors">Abrir la app</Link></li>
              <li><Link href="/market" className="text-xs text-text-secondary hover:text-text-primary transition-colors">Mercado</Link></li>
              <li><span className="text-xs text-text-tertiary/70">Solana Devnet · MVP</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-text-tertiary">© {new Date().getFullYear()} Playrs. Todos los datos deportivos provienen de fuentes públicas.</span>
          <span className="text-[10px] text-text-tertiary/70 font-mono">v1.0 · Beta</span>
        </div>
      </div>
    </footer>
  );
}
