import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, type Web3AuthOptions } from "@web3auth/modal";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";

const isMainnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet";

const solanaChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: isMainnet ? "0x1" : "0x3", // 0x1 = mainnet-beta, 0x3 = devnet (Web3Auth convention)
  rpcTarget: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  displayName: isMainnet ? "Solana Mainnet" : "Solana Devnet",
  blockExplorerUrl: isMainnet ? "https://explorer.solana.com" : "https://explorer.solana.com/?cluster=devnet",
  ticker: "SOL",
  tickerName: "Solana",
  logo: "https://images.web3auth.io/solana.svg",
};

const web3AuthOptions: Web3AuthOptions = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  web3AuthNetwork: isMainnet ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chains: [solanaChainConfig],
  defaultChainId: solanaChainConfig.chainId,
};

export const web3AuthContextConfig: Web3AuthContextConfig = { web3AuthOptions };
