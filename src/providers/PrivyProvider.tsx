"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3B82F6",
        },
        loginMethods: ["google", "email", "wallet"],
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
          showWalletUIs: true,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
