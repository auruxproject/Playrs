import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

const ERROR_STATUS: Record<string, number> = {
  platform_paused: 503,
  bet_not_found: 404,
  bet_not_open: 409,
  profile_not_found: 404,
  cannot_accept_own_duel: 403,
  match_lock_active: 409,
  insufficient_balance: 402,
};
const ERROR_MESSAGE: Record<string, string> = {
  platform_paused: "La plataforma está en pausa temporal por mantenimiento",
  bet_not_found: "Duelo no encontrado",
  bet_not_open: "Este duelo ya no está abierto",
  profile_not_found: "Perfil no encontrado",
  cannot_accept_own_duel: "No puedes aceptar tu propio duelo",
  match_lock_active: "Este duelo está bloqueado por partido en vivo (Match Lock)",
  insufficient_balance: "Saldo USDC insuficiente para aceptar este duelo",
};

// POST /api/duels/:id/accept
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const userId = await verifyAuthToken(authHeader.split(" ")[1]);
    const { id } = await params;

    const { data, error } = await supabaseAdmin.rpc("process_duel_accept", {
      p_privy_did: userId,
      p_bet_id: id,
    });

    if (error) {
      const code = error.message as string;
      const status = ERROR_STATUS[code] ?? 500;
      return NextResponse.json({ error: ERROR_MESSAGE[code] ?? "Error al aceptar el duelo" }, { status });
    }

    return NextResponse.json({ betId: data.betId, poolUsdc: data.poolUsdc, newBalance: data.newBalance });

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
