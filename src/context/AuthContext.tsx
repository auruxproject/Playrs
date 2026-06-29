"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";

export interface Profile {
  id: string;
  privy_did: string;
  username: string | null;
  avatar_emoji: string;
  wallet_address: string | null;
  balance_usdc: number;
  tier: "standard" | "silver" | "gold" | "diamond" | "legend";
  is_influencer: boolean;
  referral_code: string;
  deposited_total: number;
  withdrawn_total: number;
}

interface AuthContextType {
  ready: boolean;
  authenticated: boolean;
  loading: boolean;
  profile: Profile | null;
  walletAddress: string | null;
  email: string | null;
  login: () => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken,
  } = usePrivy();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  // Solana embedded wallet address (creada automáticamente por Privy al hacer login)
  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find(
      (a) => a.type === "wallet" && (a as { chainType?: string }).chainType === "solana"
    ) as { address?: string } | undefined)?.address ??
    null;

  const email =
    user?.email?.address ??
    (user?.google?.email ?? null);

  // Obtiene o crea el perfil del usuario en Supabase usando el token de Privy
  const syncProfile = useCallback(async () => {
    if (!authenticated) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch("/api/user", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Error al sincronizar perfil:", await res.text());
        return;
      }
      const data: Profile = await res.json();
      setProfile(data);

      // Si Privy ya creó la wallet y aún no está guardada en el perfil, la guardamos
      if (walletAddress && data.wallet_address !== walletAddress) {
        const patchRes = await fetch("/api/user", {
          method: "PATCH",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        });
        if (patchRes.ok) setProfile(await patchRes.json());
      }
    } catch (err) {
      console.error("syncProfile error:", err);
    } finally {
      setLoading(false);
    }
  }, [authenticated, getAccessToken, walletAddress]);

  useEffect(() => {
    if (ready && authenticated) {
      syncProfile();
    } else if (ready && !authenticated) {
      setProfile(null);
    }
  }, [ready, authenticated, syncProfile]);

  return (
    <AuthContext.Provider
      value={{
        ready,
        authenticated,
        loading,
        profile,
        walletAddress,
        email,
        login,
        logout,
        refreshProfile: syncProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
