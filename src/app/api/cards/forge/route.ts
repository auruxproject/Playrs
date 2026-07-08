import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

const ERROR_STATUS: Record<string, number> = {
  platform_paused: 503,
  invalid_target_tier: 400,
  profile_not_found: 404,
  player_not_found: 404,
  match_lock_active: 409,
  insufficient_cards: 409,
  insufficient_balance: 402,
};
const ERROR_MESSAGE: Record<string, string> = {
  platform_paused: "La plataforma está en pausa temporal por mantenimiento",
  invalid_target_tier: "Nivel de forja inválido",
  profile_not_found: "Perfil no encontrado",
  player_not_found: "Jugador no encontrado",
  match_lock_active: "No puedes forjar fichas de un jugador congelado por Match Lock",
  insufficient_cards: "No tienes suficientes fichas del nivel anterior para esta forja",
  insufficient_balance: "Saldo USDC insuficiente para el fee de forja",
};

// POST /api/cards/forge
// Body: { player_id: string, target_tier: "silver" | "gold" | "diamond" | "legend" }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const userId = await verifyAuthToken(authHeader.split(" ")[1]);
    const { player_id, target_tier } = await req.json();
    if (!player_id || !target_tier) {
      return NextResponse.json({ error: "player_id y target_tier requeridos" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("process_card_forge", {
      p_privy_did: userId,
      p_player_id: player_id,
      p_target_tier: target_tier,
    });

    if (error) {
      const code = error.message as string;
      const status = ERROR_STATUS[code] ?? 500;
      return NextResponse.json({ error: ERROR_MESSAGE[code] ?? "Error al procesar la forja" }, { status });
    }

    return NextResponse.json({
      newCardId: data.newCardId,
      serialNumber: data.serialNumber,
      feePaid: data.feePaid,
      cardsBurned: data.cardsBurned,
      newBalance: data.newBalance,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Token inválido";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
