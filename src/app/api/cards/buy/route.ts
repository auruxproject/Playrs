import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { supabaseAdmin } from "@/lib/supabase";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// POST /api/cards/buy
// Body: { player_id: string }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const claims = await privy.verifyAuthToken(authHeader.split(" ")[1]);
    const { player_id } = await req.json();
    if (!player_id) return NextResponse.json({ error: "player_id requerido" }, { status: 400 });

    // Obtener jugador y perfil en paralelo
    const [{ data: player }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("players").select("*").eq("id", player_id).single(),
      supabaseAdmin.from("profiles").select("*").eq("privy_did", claims.userId).single(),
    ]);

    if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    if (player.is_frozen) return NextResponse.json({ error: "Match Lock activo" }, { status: 409 });
    if (player.stock_remaining <= 0) return NextResponse.json({ error: "Stock agotado" }, { status: 409 });
    if (profile.balance_usdc < player.current_price) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 402 });
    }

    const price = player.current_price;
    const serialNumber = player.stock_total - player.stock_remaining + 1;

    // Transacción atómica: descontar balance + stock, crear ficha
    const { data: card, error: cardError } = await supabaseAdmin
      .from("user_cards")
      .insert({
        owner_id: profile.id,
        player_id,
        tier: "standard",
        serial_number: serialNumber,
        acquired_price: price,
      })
      .select()
      .single();

    if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

    await Promise.all([
      supabaseAdmin.from("players").update({ stock_remaining: player.stock_remaining - 1 }).eq("id", player_id),
      supabaseAdmin.from("profiles").update({ balance_usdc: profile.balance_usdc - price }).eq("id", profile.id),
      supabaseAdmin.from("transactions").insert({
        user_id: profile.id,
        type: "buy_ipo",
        amount: -price,
        description: `Compra IPO ${player.ticker} S/N #${serialNumber}`,
        player_id,
        card_id: card.id,
      }),
    ]);

    return NextResponse.json({ card, price_paid: price });

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
