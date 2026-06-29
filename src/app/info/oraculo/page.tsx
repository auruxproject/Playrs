"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function OraculoInfo() {
  return (
    <InfoPage
      icon="🧮"
      badge="Módulo"
      title="Oráculo Matemático"
      subtitle="El motor justo y transparente que traduce lo que pasa en la cancha en movimientos de precio."
    >
      <InfoSection title="Rendimiento real → precio">
        <p>Tras cada partido, el Oráculo toma las estadísticas oficiales del jugador (goles, asistencias, paradas, porterías a cero, tarjetas y más) y calcula una calificación de rendimiento para esa jornada.</p>
      </InfoSection>
      <InfoSection title="Justo por posición">
        <p>No se evalúa igual a un portero que a un delantero. El modelo pondera las acciones según la posición, para que cada jugador suba o baje por lo que de verdad importa en su rol.</p>
      </InfoSection>
      <InfoSection title="Topes de seguridad">
        <p>Cada jornada el precio puede variar como máximo <strong className="text-text-primary">+6%</strong> o <strong className="text-text-primary">−5%</strong>. Esto protege el mercado de movimientos extremos y mantiene el juego estable y predecible.</p>
      </InfoSection>
      <InfoSection title="Rachas">
        <p>El buen rendimiento sostenido genera rachas que refuerzan la tendencia del jugador. La consistencia se premia.</p>
      </InfoSection>
      <p className="text-xs text-text-tertiary px-1">Por integridad del juego no publicamos los coeficientes exactos del modelo, pero las reglas y los topes son siempre los mismos para todos.</p>
    </InfoPage>
  );
}
