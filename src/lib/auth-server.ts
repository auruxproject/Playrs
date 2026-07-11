import { createRemoteJWKSet, jwtVerify } from "jose";

// JWKS de Web3Auth (MetaMask Embedded Wallets) para verificar el idToken de
// social login. Esta es la URL exacta que muestra el propio dashboard del
// proyecto (Project Settings -> JWKS Endpoint) -- se había cambiado por error
// a /jwks (un ejemplo genérico de la documentación) y eso causaba
// "JWKSNoMatchingKey" porque ese endpoint no tiene las llaves de este
// proyecto/entorno. Ver docs/AUTENTICACION_WALLETS_KYC.md.
const JWKS = createRemoteJWKSet(new URL("https://api-auth.web3auth.io/.well-known/jwks.json"));

// Client ID (público) — usado para validar el claim `aud` del token, evitando
// que un token emitido para OTRO proyecto Web3Auth se acepte en el nuestro.
const CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

export class AuthTokenError extends Error {}

/**
 * Verifica el idToken JWT de social login de Web3Auth y devuelve un
 * identificador ESTABLE y ÚNICO del usuario.
 *
 * Los tokens de Web3Auth NO traen un claim `sub` estándar: el usuario se
 * identifica por `userId` (id del verificador) y por `wallets[].public_key`
 * (app-scoped, no falsificable entre proyectos). Se valida issuer + audience
 * + algoritmo ES256 antes de confiar en cualquier claim.
 */
export async function verifyAuthToken(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ["ES256"],
      issuer: "https://api-auth.web3auth.io",
      // Solo se valida audience si el Client ID está configurado en el server.
      ...(CLIENT_ID ? { audience: CLIENT_ID } : {}),
    });

    // Identificador estable: la public_key de la wallet (app-scoped, forge-proof)
    // es la opción más segura según la doc; se cae a `userId` como respaldo.
    const wallets = payload.wallets as Array<{ public_key?: string; address?: string }> | undefined;
    const walletKey = wallets?.[0]?.public_key ?? wallets?.[0]?.address;
    const userId = (payload as { userId?: string }).userId;

    const identifier = walletKey ?? userId;
    if (!identifier) throw new AuthTokenError("Token sin identificador de usuario (sin wallets ni userId)");
    return identifier;
  } catch (err) {
    if (err instanceof AuthTokenError) throw err;
    // TEMPORAL: se expone el motivo real (jose) para diagnosticar el 401 en
    // producción -- no es información sensible (nombres de claims JWT), solo
    // el porqué de la validación. Revertir a mensaje genérico una vez resuelto.
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    throw new AuthTokenError(`Token inválido -- ${detail}`);
  }
}
