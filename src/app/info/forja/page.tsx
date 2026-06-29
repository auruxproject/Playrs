"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function ForjaInfo() {
  return (
    <InfoPage
      icon="🔥"
      badge="Módulo"
      title="Forja de Fichas"
      subtitle="Fusiona fichas repetidas para crear versiones superiores, más valiosas y con mejores beneficios."
    >
      <InfoSection title="Sube de nivel fusionando">
        <p>Reúne varias fichas del mismo nivel de un jugador y fórjalas en una superior. Cada salto cuesta una pequeña tarifa en USDC y consume las fichas usadas.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Estándar → Plata: 10 fichas</li>
          <li>Plata → Oro: 8 fichas</li>
          <li>Oro → Diamante: 6 fichas</li>
          <li>Diamante → Leyenda: 5 fichas</li>
        </ul>
      </InfoSection>
      <InfoSection title="¿Por qué forjar?">
        <p>Las fichas de mayor nivel valen más, pagan menos comisiones en el mercado y en los duelos, y dan mayor bonificación por referidos. Es la forma de crecer dentro del juego.</p>
      </InfoSection>
      <InfoSection title="Leyendas retiradas">
        <p>Algunas leyendas del fútbol ya retiradas tienen fichas especiales que puedes asignar a uno de sus equipos históricos. Una capa extra de colección para los verdaderos fans.</p>
      </InfoSection>
    </InfoPage>
  );
}
