import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

const ERROR_STATUS: Record<string, number> = {
  platform_paused: 503,
  invalid_stake: 400,
  profile_not_found: 404,
  player_not_found: 404,
  match_lock_active: 409,
  insufficient_balance: 402,
};
const ERROR_MESSAGE: Record<string, string> = {
  platform_paused: "La plataforma está en pausa temporal por mantenimiento",
  invalid_stake: "El monto del duelo debe ser mayor a 0 USDC",
  profile_not_found: "Perfil no encontrado",
  player_not_found: "Jugador no encontrado",
  match_lock_active: "No puedes crear un duelo sobre un jugador congelado por Match Lock",
  insufficient_balance: "Saldo USDC insuficiente para crear este duelo",
};

// GET /api/duels?status=open
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "open";
  const { data, error } = await supabaseAdmin
    .from("bets")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ duels: data });
}

// POST /api/duels
// Body: { player_id: string, title: string, bet_type: string, stake: number }
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const userId = await verifyAuthToken(authHeader.split(" ")[1]);
    const { player_id, title, bet_type, stake } = await req.json();
    if (!player_id || !title || !bet_type || !stake) {
      return NextResponse.json({ error: "player_id, title, bet_type y stake son requeridos" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("process_duel_create", {
      p_privy_did: userId,
      p_player_id: player_id,
      p_title: title,
      p_bet_type: bet_type,
      p_stake: stake,
    });

    if (error) {
      const code = error.message as string;
      const status = ERROR_STATUS[code] ?? 500;
      return NextResponse.json({ error: ERROR_MESSAGE[code] ?? "Error al crear el duelo" }, { status });
    }

    return NextResponse.json({ betId: data.betId, newBalance: data.newBalance }, { status: 201 });

  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
