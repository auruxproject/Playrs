import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/cards/buy
// Body: { player_id: string }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ERROR_STATUS: Record<string, number> = {
    platform_paused: 503,
    profile_not_found: 404,
    player_not_found: 404,
    match_lock_active: 409,
    stock_depleted: 409,
    insufficient_balance: 402,
  };
  const ERROR_MESSAGE: Record<string, string> = {
    platform_paused: "La plataforma está en pausa temporal por mantenimiento",
    profile_not_found: "Perfil no encontrado",
    player_not_found: "Jugador no encontrado",
    match_lock_active: "Este mercado está cerrado temporalmente por partido en vivo (Match Lock)",
    stock_depleted: "Fichas agotadas en IPO",
    insufficient_balance: "Saldo USDC insuficiente para comprar esta ficha",
  };

  try {
    const userId = await verifyAuthToken(authHeader.split(" ")[1]);
    const { player_id } = await req.json();
    if (!player_id) return NextResponse.json({ error: "player_id requerido" }, { status: 400 });

    // Función RPC atómica (bloqueo de fila): evita la condición de carrera de
    // dos compras simultáneas leyendo/pisando el mismo stock/balance.
    const { data, error } = await supabaseAdmin.rpc("process_card_purchase", {
      p_privy_did: userId,
      p_player_id: player_id,
    });

    if (error) {
      const code = error.message as string;
      const status = ERROR_STATUS[code] ?? 500;
      return NextResponse.json({ error: ERROR_MESSAGE[code] ?? "Error al procesar la compra" }, { status });
    }

    return NextResponse.json({
      cardId: data.card_id,
      pricePaid: data.price_paid,
      serialNumber: data.serial_number,
      newBalance: data.new_balance,
    });

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
