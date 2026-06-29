"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function DuelosInfo() {
  return (
    <InfoPage
      icon="⚔️"
      badge="Módulo"
      title="Duelos P2P"
      subtitle="Rétate con otros jugadores sobre el rendimiento de una estrella. El que acierta se lleva el pozo."
    >
      <InfoSection title="¿Cómo funciona un duelo?">
        <p>Creas un reto sobre un jugador (por ejemplo: “¿marcará gol en su próximo partido?” o “¿superará cierta puntuación?”), pones tu apuesta en USDC y otro usuario la acepta. Se forma un pozo entre ambos.</p>
      </InfoSection>
      <InfoSection title="Resolución automática">
        <p>Cuando el partido termina y el Oráculo procesa las estadísticas reales, el duelo se resuelve solo. El ganador recibe el pozo menos una pequeña comisión (rake).</p>
      </InfoSection>
      <InfoSection title="Comisiones más bajas si tienes la ficha">
        <p>Si posees fichas del jugador del duelo, tu comisión baja. Y a mayor nivel de ficha (Plata, Oro, Diamante, Leyenda), menor es el rake. Jugar con tu plantilla te conviene.</p>
      </InfoSection>
    </InfoPage>
  );
}
