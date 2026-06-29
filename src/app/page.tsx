"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "📈",
    title: "Mercado de Atletas",
    desc: "Compra fichas digitales de futbolistas de élite en su IPO. Su precio sube o baja según el rendimiento real en el campo.",
  },
  {
    icon: "🧮",
    title: "Oráculo Matemático",
    desc: "Un motor verificado convierte goles, asistencias, paradas y más en variaciones de precio justas, limitadas a +6% / −5% por jornada.",
  },
  {
    icon: "⚔️",
    title: "Duelos P2P",
    desc: "Reta a otros usuarios: ¿marcará Haaland? ¿superará Mbappé los 8.5 puntos? El ganador se lleva el pozo.",
  },
  {
    icon: "🔥",
    title: "Forja de Fichas",
    desc: "Fusiona fichas estándar para forjar versiones Plata, Oro, Diamante y Leyenda, con mejores comisiones y valor.",
  },
  {
    icon: "🪙",
    title: "Wallet Solana",
    desc: "Al registrarte se crea automáticamente tu wallet en Solana. Deposita y retira USDC sin custodia de terceros.",
  },
  {
    icon: "🛡️",
    title: "Seguro y Transparente",
    desc: "Reglas claras, comisiones fijas por nivel y precios anclados al rendimiento deportivo, no a la especulación ciega.",
  },
];

const TIERS = [
  { name: "Estándar", color: "from-blue/20 to-blue/5 border-blue/30", text: "text-blue", emoji: "⚪" },
  { name: "Plata", color: "from-slate-400/20 to-slate-400/5 border-slate-400/30", text: "text-slate-300", emoji: "🥈" },
  { name: "Oro", color: "from-amber-500/20 to-amber-500/5 border-amber-500/30", text: "text-amber-400", emoji: "🥇" },
  { name: "Diamante", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30", text: "text-cyan-400", emoji: "💎" },
  { name: "Leyenda", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30", text: "text-purple-400", emoji: "👑" },
];

const STEPS = [
  { n: "1", title: "Crea tu cuenta", desc: "Entra con Google o tu wallet. Generamos tu wallet de Solana al instante." },
  { n: "2", title: "Compra fichas", desc: "Adquiere fichas de tus jugadores favoritos en el mercado primario (IPO)." },
  { n: "3", title: "Gana con su rendimiento", desc: "Si rinden en la cancha, su precio sube. Vende, apuesta o forja para crecer." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue/10 border border-blue/30 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <defs>
                  <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#00D68F" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" stroke="url(#lg)" strokeWidth="5" strokeDasharray="16 8" />
                <polygon points="50,25 70,38 70,62 50,75 30,62 30,38" fill="url(#lg)" opacity="0.85" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-widest uppercase text-text-primary">Playrs</span>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-blue text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue"
          >
            Entrar a la App
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-green/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-blue bg-blue/10 border border-blue/20 px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green rounded-full animate-pulse" />
            Inteligencia deportiva sobre Solana
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-text-primary leading-[1.05]">
            Invierte en el <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">talento</span> del fútbol
          </h1>
          <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Playrs es la plataforma donde el rendimiento real de los futbolistas de élite mueve el precio de fichas digitales. Colecciona, intercambia, apuesta y forja — todo respaldado por un oráculo matemático justo.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue to-green text-white text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue"
            >
              Empezar ahora →
            </Link>
            <Link
              href="/market"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-background-secondary border border-border text-text-primary text-base font-bold hover:border-blue/40 transition-all"
            >
              Ver el mercado
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-tertiary">Sin custodia · Wallet Solana automática · Comisiones transparentes</p>
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-3">¿Cómo funciona?</h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">En tres pasos estás dentro del juego.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="relative bg-background-secondary border border-border rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-blue/10 border border-blue/30 flex items-center justify-center text-blue font-black text-lg mb-4">
                {s.n}
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1.5">{s.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-3">Todo en una plataforma</h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">Un ecosistema completo de coleccionismo y predicción deportiva.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-background-secondary border border-border rounded-2xl p-6 hover:border-blue/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center text-2xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tiers ─── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-text-primary text-center mb-3">5 niveles de fichas</h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">Forja fichas superiores fusionando las que ya tienes. A mayor nivel, mejores comisiones y mayor valor.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {TIERS.map((t) => (
            <div key={t.name} className={`flex-1 min-w-[140px] max-w-[180px] bg-gradient-to-b ${t.color} border rounded-2xl p-5 text-center`}>
              <div className="text-3xl mb-2">{t.emoji}</div>
              <span className={`text-sm font-black uppercase tracking-wider ${t.text}`}>{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-4xl mx-auto px-5 py-16">
        <div className="relative bg-gradient-to-br from-blue/15 to-green/10 border border-blue/20 rounded-3xl p-10 text-center overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-3">Tu equipo te espera</h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">Crea tu cuenta gratis y empieza a construir tu portafolio de estrellas del fútbol hoy mismo.</p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue to-green text-white text-base font-bold hover:opacity-90 active:scale-95 transition-all shadow-glow-blue"
          >
            Crear mi cuenta →
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-widest uppercase text-text-primary">Playrs</span>
            <span className="text-xs text-text-tertiary">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-text-tertiary">
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">App</Link>
            <Link href="/market" className="hover:text-text-primary transition-colors">Mercado</Link>
            <span className="text-text-tertiary/60">Solana Devnet · MVP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
