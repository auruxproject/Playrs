import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { supabaseAdmin } from "@/lib/supabase";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// Obtiene o crea el perfil del usuario autenticado con Privy
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    const claims = await privy.verifyAuthToken(token);
    const privyDid = claims.userId;

    // Buscar perfil existente
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("privy_did", privyDid)
      .single();

    if (existing) return NextResponse.json(existing);

    // Crear perfil nuevo
    const { data: newProfile, error } = await supabaseAdmin
      .from("profiles")
      .insert({ privy_did: privyDid })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(newProfile, { status: 201 });

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
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
