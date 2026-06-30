import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { recordUserCall } from "@/lib/diag";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// Obtiene o crea el perfil del usuario autenticado con Privy
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    recordUserCall("no-auth-header", false, "Falta header Authorization Bearer");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  let privyDid: string;
  try {
    const claims = await privy.verifyAuthToken(token);
    privyDid = claims.userId;
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

// Actualiza el perfil (username, avatar, wallet_address)
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const body = await req.json();

  try {
    const claims = await privy.verifyAuthToken(token);

    const allowed = ["username", "avatar_emoji", "wallet_address"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("privy_did", claims.userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
