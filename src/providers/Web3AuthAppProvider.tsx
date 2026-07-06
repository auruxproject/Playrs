"use client";

import { Web3AuthProvider } from "@web3auth/modal/react";
import { SolanaProvider } from "@web3auth/modal/react/solana";
import { web3AuthContextConfig } from "@/lib/web3authConfig";

export function Web3AuthAppProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID) {
    return <>{children}</>;
  }

  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <SolanaProvider>{children}</SolanaProvider>
    </Web3AuthProvider>
  );
}
