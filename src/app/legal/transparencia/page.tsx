"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function TransparenciaPage() {
  return (
    <InfoPage
      icon="🛡️"
      badge="Legal"
      title="Transparencia y seguridad"
      subtitle="Reglas claras, datos públicos y control de tus fondos. Así jugamos limpio."
      hideCta
    >
      <InfoSection title="Reglas iguales para todos">
        <p>El Oráculo aplica las mismas reglas y los mismos topes (+6% / −5% por jornada) a todos los jugadores. Nadie recibe trato preferente en el cálculo de precios.</p>
      </InfoSection>
      <InfoSection title="Comisiones a la vista">
        <p>Las comisiones de mercado, duelos y forja son fijas por nivel y se muestran dentro de la app antes de cada operación. Sin cargos ocultos.</p>
      </InfoSection>
      <InfoSection title="Tus fondos, tu control">
        <p>Tu wallet es no-custodial: Playrs nunca guarda tus claves ni tu dinero. Durante la beta operamos en la red de pruebas de Solana (devnet).</p>
      </InfoSection>
      <InfoSection title="Match Lock anti-ventaja">
        <p>Congelamos el mercado de un jugador mientras juega en vivo, para que nadie opere con información que otros no tienen.</p>
      </InfoSection>
    </InfoPage>
  );
}
