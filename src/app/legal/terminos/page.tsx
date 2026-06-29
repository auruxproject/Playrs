"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function TerminosPage() {
  return (
    <InfoPage
      badge="Legal"
      title="Términos de uso"
      subtitle="Las reglas para usar Playrs. Al crear una cuenta aceptas estas condiciones."
      hideCta
    >
      <InfoSection title="1. Qué es Playrs">
        <p>Playrs es una plataforma de entretenimiento de fantasy trading sintético. Las fichas representan posiciones dentro del juego y su valor se calcula a partir de datos públicos de rendimiento deportivo. Playrs no es un servicio de inversión ni un mercado de valores.</p>
      </InfoSection>
      <InfoSection title="2. Cuenta y elegibilidad">
        <p>Debes tener la edad legal en tu país y cumplir las leyes aplicables. Eres responsable de la seguridad de tu cuenta y de tu wallet.</p>
      </InfoSection>
      <InfoSection title="3. Uso permitido">
        <p>No está permitido manipular el mercado, usar bots para obtener ventaja, ni intentar vulnerar la plataforma. Podemos suspender cuentas que incumplan estas reglas.</p>
      </InfoSection>
      <InfoSection title="4. Fondos y comisiones">
        <p>Operas con USDC a través de tu wallet no-custodial. Cada operación puede tener una comisión que se muestra dentro de la app. Tú controlas tus fondos en todo momento.</p>
      </InfoSection>
      <InfoSection title="5. Cambios">
        <p>Podemos actualizar estos términos a medida que la plataforma evoluciona. Avisaremos de cambios relevantes.</p>
      </InfoSection>
      <p className="text-xs text-text-tertiary px-1">Documento preliminar de la beta. Antes del lanzamiento público se revisará con asesoría legal.</p>
    </InfoPage>
  );
}
