import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { supabaseAdmin } from "@/lib/supabase";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// GET /api/cards — lista las fichas del usuario autenticado (con datos del jugador)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const claims = await privy.verifyAuthToken(authHeader.split(" ")[1]);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("privy_did", claims.userId)
      .single();

    if (!profile) return NextResponse.json([], { status: 200 });

    const { data, error } = await supabaseAdmin
      .from("user_cards")
      .select("*, players(name, ticker, team, position, current_price, price_change_pct, is_frozen)")
      .eq("owner_id", profile.id)
      .order("acquired_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
