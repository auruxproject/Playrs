import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

const ERROR_STATUS: Record<string, number> = {
  platform_paused: 503,
  profile_not_found: 404,
  card_not_found: 404,
  player_not_found: 404,
  match_lock_active: 409,
};
const ERROR_MESSAGE: Record<string, string> = {
  platform_paused: "La plataforma está en pausa temporal por mantenimiento",
  profile_not_found: "Perfil no encontrado",
  card_not_found: "Ficha no encontrada en tu inventario",
  player_not_found: "Jugador no encontrado",
  match_lock_active: "Este mercado está cerrado temporalmente por partido en vivo (Match Lock)",
};

// POST /api/cards/sell
// Body: { card_id: string }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const userId = await verifyAuthToken(authHeader.split(" ")[1]);
    const { card_id } = await req.json();
    if (!card_id) return NextResponse.json({ error: "card_id requerido" }, { status: 400 });

    const { data, error } = await supabaseAdmin.rpc("process_card_sale", {
      p_privy_did: userId,
      p_card_id: card_id,
    });

    if (error) {
      const code = error.message as string;
      const status = ERROR_STATUS[code] ?? 500;
      return NextResponse.json({ error: ERROR_MESSAGE[code] ?? "Error al procesar la venta" }, { status });
    }

    return NextResponse.json({
      sellingPrice: data.sellingPrice,
      fee: data.fee,
      finalAmount: data.finalAmount,
      newBalance: data.newBalance,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Token inválido";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
