"use client";

import { InfoPage, InfoSection, ComingSoon } from "@/components/site/InfoPage";

const TIERS = [
  { emoji: "⚪", name: "Estándar", color: "text-blue", desc: "El punto de partida. Toda ficha nace estándar al comprarla en el mercado de salida.", perks: ["Acceso completo al mercado", "Duelos P2P", "Comisión base"] },
  { emoji: "🥈", name: "Plata", color: "text-slate-300", desc: "Tu primer salto. Se forja con 10 fichas estándar del mismo jugador.", perks: ["Comisiones reducidas", "Mayor valor de ficha", "Mejor bonificación por referidos"] },
  { emoji: "🥇", name: "Oro", color: "text-amber-400", desc: "Para jugadores comprometidos. Se forja con 8 fichas Plata.", perks: ["Comisiones más bajas", "Estatus VIP", "Bonos de referido superiores"] },
  { emoji: "💎", name: "Diamante", color: "text-cyan-400", desc: "Élite. Se forja con 6 fichas Oro.", perks: ["Comisiones mínimas", "Beneficios exclusivos", "Prioridad en novedades"] },
  { emoji: "👑", name: "Leyenda", color: "text-purple-400", desc: "La cima. Se forja con 5 fichas Diamante.", perks: ["Las mejores comisiones del juego", "Máxima bonificación por referidos", "Reconocimiento de leyenda"] },
];

export default function NivelesPage() {
  return (
    <InfoPage
      icon="🏆"
      badge="Niveles"
      title="5 niveles de fichas"
      subtitle="Cuanto más alto el nivel, mejores comisiones, mayor valor y más beneficios. Se sube forjando (fusionando) fichas."
    >
      {TIERS.map((t) => (
        <InfoSection key={t.name} title={`${t.emoji}  ${t.name}`}>
          <p>{t.desc}</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {t.perks.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </InfoSection>
      ))}
      <InfoSection title="Programa de Influencers">
        <p>Un nivel especial para creadores de contenido con bonificaciones de referido ampliadas. <ComingSoon /></p>
      </InfoSection>
      <p className="text-xs text-text-tertiary px-1">Algunos beneficios se irán activando progresivamente durante la beta. Los porcentajes exactos de comisión por nivel se muestran dentro de la app.</p>
    </InfoPage>
  );
}
