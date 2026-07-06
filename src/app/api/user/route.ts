import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { recordUserCall } from "@/lib/diag";

// Obtiene o crea el perfil del usuario autenticado con Web3Auth
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    recordUserCall("no-auth-header", false, "Falta header Authorization Bearer");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  let privyDid: string;
  try {
    privyDid = await verifyAuthToken(token);
  } catch (e) {
    recordUserCall("verify-token", false, e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    // Buscar perfil existente
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("privy_did", privyDid)
      .single();

    if (existing) {
      recordUserCall("found-existing", true);
      return NextResponse.json(existing);
    }

    // Crear perfil nuevo. En devnet (beta) se otorga saldo de prueba para poder operar.
    const isDevnet = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet") !== "mainnet";
    const { data: newProfile, error } = await supabaseAdmin
      .from("profiles")
      .insert({ privy_did: privyDid, balance_usdc: isDevnet ? 1000 : 0 })
      .select()
      .single();

    if (error) {
      recordUserCall("insert-profile", false, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    recordUserCall("created-profile", true);
    return NextResponse.json(newProfile, { status: 201 });
  } catch (e) {
    recordUserCall("db-exception", false, e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

const USERNAME_ERROR_STATUS: Record<string, number> = {
  profile_not_found: 404,
  username_change_too_soon: 403,
  username_taken: 409,
};
const USERNAME_ERROR_MESSAGE: Record<string, string> = {
  profile_not_found: "Perfil no encontrado",
  username_change_too_soon: "Solo puedes cambiar tu nombre de usuario una vez cada 365 días",
  username_taken: "Ese nombre de usuario ya está en uso",
};

// Actualiza el perfil (username, avatar, wallet_address)
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const body = await req.json();

  try {
    const userId = await verifyAuthToken(token);

    // El cambio de username pasa por la política de 1 cambio/año, validada
    // atómicamente en el servidor (nunca solo en el cliente).
    if ("username" in body) {
      const { data, error } = await supabaseAdmin.rpc("process_username_change", {
        p_privy_did: userId,
        p_new_username: body.username,
      });

      if (error) {
        const code = error.message as string;
        const status = USERNAME_ERROR_STATUS[code] ?? 500;
        return NextResponse.json({ error: USERNAME_ERROR_MESSAGE[code] ?? "Error al cambiar el username" }, { status });
      }

      // Si además vienen avatar/wallet en el mismo body, se aplican aparte (sin restricción).
      const rest = ["avatar_emoji", "wallet_address"];
      const restUpdate: Record<string, unknown> = {};
      for (const key of rest) {
        if (key in body) restUpdate[key] = body[key];
      }
      if (Object.keys(restUpdate).length > 0) {
        const { data: updated, error: restError } = await supabaseAdmin
          .from("profiles")
          .update(restUpdate)
          .eq("privy_did", userId)
          .select()
          .single();
        if (restError) return NextResponse.json({ error: restError.message }, { status: 500 });
        return NextResponse.json(updated);
      }

      return NextResponse.json(data);
    }

    const allowed = ["avatar_emoji", "wallet_address"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("privy_did", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
