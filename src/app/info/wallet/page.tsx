"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function WalletInfo() {
  return (
    <InfoPage
      icon="🪙"
      badge="Módulo"
      title="Wallet Solana"
      subtitle="Tu billetera para mover USDC dentro de Playrs, creada automáticamente y sin que nadie custodie tus fondos."
    >
      <InfoSection title="Se crea sola al entrar">
        <p>Cuando creas tu cuenta con Google o correo, generamos tu wallet de Solana automáticamente. No necesitas saber de cripto para empezar.</p>
      </InfoSection>
      <InfoSection title="No-custodial">
        <p>La llave de tu wallet la controlas tú, no Playrs. Nosotros nunca guardamos tu dinero ni tus claves: eso reduce el riesgo y te da el control real de tus fondos.</p>
      </InfoSection>
      <InfoSection title="¿Ya tienes wallet?">
        <p>Si usas Phantom, MetaMask u otra, también puedes conectarla directamente en lugar de usar la integrada.</p>
      </InfoSection>
      <InfoSection title="Depósitos y retiros en USDC">
        <p>Operas con USDC (una moneda estable atada al dólar). Depositas para jugar y retiras tus ganancias cuando quieras. Comienza en la red de pruebas (devnet) durante la beta.</p>
      </InfoSection>
    </InfoPage>
  );
}
