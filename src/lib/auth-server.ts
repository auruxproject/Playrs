import { createRemoteJWKSet, jwtVerify } from "jose";

// JWKS de Web3Auth para verificar el idToken emitido tras el login.
// Ver docs/AUTENTICACION_WALLETS_KYC.md — migración desde Privy.
const JWKS = createRemoteJWKSet(new URL("https://api-auth.web3auth.io/.well-known/jwks.json"));

export class AuthTokenError extends Error {}

/**
 * Verifica el idToken JWT emitido por Web3Auth y devuelve el identificador
 * estable del usuario (claim `sub`), equivalente a `claims.userId` de Privy.
 */
export async function verifyAuthToken(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, JWKS);
    if (!payload.sub) throw new AuthTokenError("Token sin claim 'sub'");
    return payload.sub;
  } catch {
    throw new AuthTokenError("Token inválido");
  }
}
