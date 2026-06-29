"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const FEATURES = [
  {
    href: "/info/mercado",
    icon: "📈",
    title: "Mercado de Atletas",
    desc: "Compra fichas de futbolistas en su salida (IPO). Su precio sintético sube o baja según lo que hacen en el campo, en la vida real.",
  },
  {
    href: "/info/oraculo",
    icon: "🧮",
    title: "Oráculo Matemático",
    desc: "Un motor justo convierte goles, asistencias y paradas reales en variación de precio, con topes de +6% / −5% por jornada.",
  },
  {
    href: "/info/duelos",
    icon: "⚔️",
    title: "Duelos P2P",
    desc: "Rétate con otros jugadores sobre el rendimiento de una estrella. El que acierta se lleva el pozo.",
  },
  {
    href: "/info/forja",
    icon: "🔥",
    title: "Forja de Fichas",
    desc: "Fusiona fichas repetidas para forjar versiones superiores: Plata, Oro, Diamante y Leyenda.",
  },
  {
    href: "/info/wallet",
    icon: "🪙",
    title: "Wallet Solana",
    desc: "Al entrar se crea tu wallet de Solana automáticamente. Deposita y retira USDC sin custodia de terceros.",
  },
  {
    href: "/legal/transparencia",
    icon: "🛡️",
    title: "Seguro y Transparente",
    desc: "Reglas claras, comisiones fijas por nivel y 100% datos públicos. Sin letras pequeñas escondidas.",
  },
];

const STEPS = [
  { n: "1", title: "Crea tu cuenta", desc: "Entra con Google, correo o tu wallet. Te generamos tu wallet de Solana al instante." },
  { n: "2", title: "Arma tu plantilla", desc: "Compra fichas de tus jugadores favoritos en el mercado de salida (IPO)." },
  { n: "3", title: "Sube con su rendimiento", desc: "Si rinden en la cancha, su valor sube. Comercia, retá en duelos o forja para crecer." },
];

const TIERS = [
  { name: "Estándar", color: "from-blue/20 to-blue/5 border-blue/30", text: "text-blue", emoji: "⚪" },
  { name: "Plata", color: "from-slate-400/20 to-slate-400/5 border-slate-400/30", text: "text-slate-300", emoji: "🥈" },
  { name: "Oro", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30", text: "text-amber-400", emoji: "🥇" },
  { name: "Diamante", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30", text: "text-cyan-400", emoji: "💎" },
  { name: "Leyenda", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30", text: "text-purple-400", emoji: "👑" },
];

const STATS = [
  { value: "+6% / −5%", label: "Tope de variación por jornada" },
  { value: "5", label: "Niveles de fichas" },
  { value: "100%", label: "Datos públicos reales" },
  { value: "0", label: "Custodia de tus fondos" },
];

export default function Landing() {
  const router = useRouter();
  const { ready, authenticated, login } = useAuth();

  const handleEnter = () => {
    if (authenticated) router.push("/dashboard");
    else login();
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      {/* ─── Hero ─── */}
      <section className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-60 left-0 w-[300px] h-[300px] bg-purple/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-14 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue bg-blue/10 border border-blue/20 px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green rounded-full animate-pulse" />
            El fantasy trading del fútbol real
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text-primary leading-[1.05]">
            Comercia el <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">valor</span> de las estrellas del fútbol
          </h1>
          <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Playrs es un juego de trading sintético: colecciona fichas de futbolistas y su precio se mueve con su <strong className="text-text-primary">rendimiento real</strong> en la cancha. Compra, intercambia, reta en duelos y forja fichas legendarias — todo con reglas justas y datos 100% públicos.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleEnter}
              disabled={!ready}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue to-green text-white text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue cursor-pointer disabled:opacity-60"
            >
              {authenticated ? "Ir a la App →" : "Jugar gratis →"}
            </button>
            <Link
              href="/market"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-background-secondary border border-border text-text-primary text-base font-bold hover:border-blue/40 transition-all"
            >
              Ver el mercado en vivo
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-tertiary">Sin custodia · Wallet Solana automática · Empiezas en segundos</p>

          {/* Stat band */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="bg-background-secondary border border-border rounded-2xl p-4">
                <div className="text-xl font-black font-mono-nums bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">{s.value}</div>
                <div className="text-[11px] text-text-tertiary mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-3">¿Cómo funciona?</h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">En tres pasos ya estás dentro del juego.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="relative bg-background-secondary border border-border rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-blue/10 border border-blue/30 flex items-center justify-center text-blue font-black text-lg mb-4">{s.n}</div>
              <h3 className="text-lg font-bold text-text-primary mb-1.5">{s.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={handleEnter} className="text-sm text-blue font-bold hover:underline cursor-pointer">
            {authenticated ? "Ir a la App →" : "Crear mi cuenta gratis →"}
          </button>
        </div>
      </section>

      {/* ─── Features (cada tarjeta es un enlace) ─── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-3">Todo en una plataforma</h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">Toca cada módulo para conocer cómo funciona.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group bg-background-secondary border border-border rounded-2xl p-6 hover:border-blue/40 hover:shadow-glow-blue/10 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center text-2xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                {f.title}
                <span className="text-blue opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              <span className="inline-block mt-3 text-xs font-bold text-blue">Saber más →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Tiers ─── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-3">5 niveles de fichas</h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">Forja fichas superiores fusionando las que ya tienes. A mayor nivel, mejores comisiones y mayor valor.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {TIERS.map((t) => (
            <Link
              key={t.name}
              href="/niveles"
              className={`flex-1 min-w-[140px] max-w-[180px] bg-gradient-to-b ${t.color} border rounded-2xl p-5 text-center hover:scale-[1.03] transition-transform`}
            >
              <div className="text-3xl mb-2">{t.emoji}</div>
              <span className={`text-sm font-black uppercase tracking-wider ${t.text}`}>{t.name}</span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/niveles" className="text-sm text-blue font-bold hover:underline">Ver beneficios de cada nivel →</Link>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <div className="relative bg-gradient-to-br from-blue/15 via-purple/10 to-green/10 border border-blue/20 rounded-3xl p-10 text-center overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-green/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="relative text-2xl sm:text-4xl font-black text-text-primary mb-3">Tu plantilla de estrellas te espera</h2>
          <p className="relative text-text-secondary mb-8 max-w-lg mx-auto">Únete gratis a la beta. Sin tarjeta, sin complicaciones — solo entra y juega.</p>
          <button
            onClick={handleEnter}
            disabled={!ready}
            className="relative inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue to-green text-white text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue cursor-pointer disabled:opacity-60"
          >
            {authenticated ? "Ir a la App →" : "Empezar gratis ahora →"}
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
