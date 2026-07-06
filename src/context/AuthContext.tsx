"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser, useAuthTokenInfo } from "@web3auth/modal/react";
import { useSolanaWallet } from "@web3auth/modal/react/solana";

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
  /** Token de sesión de Web3Auth para llamar endpoints autenticados (Authorization: Bearer). */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInitialized } = useWeb3Auth();
  const { isConnected, connect } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { userInfo, getUserInfo } = useWeb3AuthUser();
  const { getAuthTokenInfo } = useAuthTokenInfo();
  const { accounts } = useSolanaWallet();

  const ready = isInitialized;
  const walletAddress = accounts?.[0] ?? null;
  const email = userInfo?.email ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  // Obtiene o crea el perfil del usuario en Supabase usando el idToken de Web3Auth
  const syncProfile = useCallback(async () => {
    if (!isConnected) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      await getUserInfo();
      const token = await getAuthTokenInfo();
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

      // Si Web3Auth ya generó la wallet Solana y aún no está guardada en el perfil, la guardamos
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
  }, [isConnected, getUserInfo, getAuthTokenInfo, walletAddress]);

  useEffect(() => {
    if (ready && isConnected) {
      syncProfile();
    } else if (ready && !isConnected) {
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isConnected]);

  return (
    <AuthContext.Provider
      value={{
        ready,
        authenticated: isConnected,
        loading,
        profile,
        walletAddress,
        email,
        login: () => {
          void connect();
        },
        logout: () => {
          void disconnect();
        },
        refreshProfile: syncProfile,
        getToken: getAuthTokenInfo,
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
