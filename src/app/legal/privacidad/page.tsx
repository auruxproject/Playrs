"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function PrivacidadPage() {
  return (
    <InfoPage
      badge="Legal"
      title="Política de privacidad"
      subtitle="Cómo tratamos tus datos. Lo mínimo necesario, con respeto a tu privacidad."
      hideCta
    >
      <InfoSection title="Qué datos recogemos">
        <p>Los datos de tu cuenta a través de nuestro proveedor de autenticación (por ejemplo, tu correo) y la dirección pública de tu wallet. No almacenamos tus claves privadas.</p>
      </InfoSection>
      <InfoSection title="Para qué los usamos">
        <p>Únicamente para que la plataforma funcione: crear tu perfil, registrar tus operaciones dentro del juego y darte soporte.</p>
      </InfoSection>
      <InfoSection title="Con quién los compartimos">
        <p>Con los servicios que hacen posible la plataforma (autenticación, base de datos, infraestructura). No vendemos tus datos a terceros.</p>
      </InfoSection>
      <InfoSection title="Tus derechos">
        <p>Puedes solicitar acceso o eliminación de tus datos personales escribiéndonos.</p>
      </InfoSection>
      <p className="text-xs text-text-tertiary px-1">Documento preliminar de la beta. Antes del lanzamiento público se revisará con asesoría legal.</p>
    </InfoPage>
  );
}
