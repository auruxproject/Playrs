"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function MercadoInfo() {
  return (
    <InfoPage
      icon="📈"
      badge="Módulo"
      title="Mercado de Atletas"
      subtitle="El corazón de Playrs: aquí compras y comercias fichas de futbolistas cuyo precio sintético refleja su rendimiento real."
    >
      <InfoSection title="¿Qué es una ficha?">
        <p>Cada futbolista tiene fichas digitales coleccionables con un número de serie único. Tener una ficha es tener una posición sobre el valor de ese jugador dentro del juego.</p>
      </InfoSection>
      <InfoSection title="Mercado de salida (IPO)">
        <p>Los jugadores nuevos salen con un stock limitado a un precio ancla. Cuando se agotan las fichas de la salida, el resto del movimiento ocurre entre usuarios en el mercado secundario.</p>
      </InfoSection>
      <InfoSection title="¿Por qué sube o baja el precio?">
        <p>El precio se mueve con el rendimiento real del jugador en sus partidos (goles, asistencias, paradas, etc.), procesado por nuestro Oráculo Matemático con topes de seguridad de +6% / −5% por jornada para evitar movimientos bruscos.</p>
      </InfoSection>
      <InfoSection title="Match Lock">
        <p>Mientras un jugador disputa un partido en vivo, su mercado se congela temporalmente para que nadie opere con ventaja informativa. Al terminar y procesarse las estadísticas, se reabre.</p>
      </InfoSection>
    </InfoPage>
  );
}
