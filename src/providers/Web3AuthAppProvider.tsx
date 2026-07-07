"use client";

import { Web3AuthProvider } from "@web3auth/modal/react";
import { SolanaProvider } from "@web3auth/modal/react/solana";
import { web3AuthContextConfig } from "@/lib/web3authConfig";

// Siempre envuelve en Web3AuthProvider, incluso sin Client ID configurado:
// AuthContext usa los hooks de Web3Auth incondicionalmente, así que sin este
// wrapper esos hooks explotan ("not wrapped in modal Web3AuthProvider") en
// vez de simplemente fallar el login -- rompía hasta el build de producción
// al prerenderizar /_not-found. Con el wrapper siempre presente, si falta el
// Client ID el login fallará de forma controlada al conectar, no en cada hook.
export function Web3AuthAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <SolanaProvider>{children}</SolanaProvider>
    </Web3AuthProvider>
  );
}
