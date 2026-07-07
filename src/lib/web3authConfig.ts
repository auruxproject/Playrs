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

// El SDK de Web3Auth valida el clientId al construirse (incluso durante el
// prerenderizado en servidor de Next.js) y lanza una excepción si está vacío,
// lo que tumbaría el build ENTERO del sitio, no solo el login. Se usa un
// placeholder como respaldo para que el build nunca se caiga por esto -- si
// falta la variable real, el login simplemente fallará en el navegador con
// un error claro ("Project not found"), en vez de dejar toda la app sin
// desplegar. Ver docs/ESTADO_PROYECTO_TECNICO.md.
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BPLACEHOLDER_MISSING_CLIENT_ID";

if (!process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID) {
  console.warn(
    "[web3authConfig] NEXT_PUBLIC_WEB3AUTH_CLIENT_ID no está configurada -- " +
    "el login no funcionará hasta que se agregue en las variables de entorno."
  );
}

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: isMainnet ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chains: [solanaChainConfig],
  defaultChainId: solanaChainConfig.chainId,
};

export const web3AuthContextConfig: Web3AuthContextConfig = { web3AuthOptions };
