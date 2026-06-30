import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runOracle } from "@/lib/engine/oracle";
import type { Competition } from "@/lib/engine/types";

// API-SPORTS directo (https://dashboard.api-football.com). Cabecera: x-apisports-key.
const APISPORTS_KEY = process.env.APISPORTS_KEY ?? process.env.RAPIDAPI_KEY!;
const APISPORTS_HOST = process.env.APISPORTS_HOST ?? "v3.football.api-sports.io";

// POST /api/oracle/run
// Body: { fixture_id: number, competition: string }
// Procesa las estadísticas de un partido y actualiza los precios
export async function POST(req: NextRequest) {
  // Solo accesible con clave interna (cron job / oracle worker)
  const apiKey = req.headers.get("x-oracle-key");
  if (apiKey !== process.env.ORACLE_SECRET_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { fixture_id, competition = "LIGA" } = await req.json();
  if (!fixture_id) {
    return NextResponse.json({ error: "fixture_id requerido" }, { status: 400 });
  }

  // 1. Obtener estadísticas del partido desde API-SPORTS
  const statsRes = await fetch(
    `https://${APISPORTS_HOST}/fixtures/players?fixture=${fixture_id}`,
    {
      headers: {
        "x-apisports-key": APISPORTS_KEY,
      },
    }
  );

  if (!statsRes.ok) {
    return NextResponse.json({ error: "Error al obtener datos de API-Football" }, { status: 502 });
  }

  const statsData = await statsRes.json();
  const playerStats = statsData?.response ?? [];

  // 2. Obtener todos los jugadores activos del catálogo con su api_football_id
  const { data: catalogPlayers } = await supabaseAdmin
    .from("players")
    .select("id, api_football_id, position, current_price, streak, is_frozen")
    .not("api_football_id", "is", null)
    .eq("is_frozen", false);

  if (!catalogPlayers?.length) {
    return NextResponse.json({ message: "No hay jugadores para procesar" });
  }

  const results: Array<{ player_id: string; price_after: number; change_pct: number }> = [];

  // 3. Por cada equipo en las estadísticas del fixture
  for (const teamData of playerStats) {
    for (const playerStat of teamData.players ?? []) {
      const apiId = playerStat.player?.id;
      const catalogPlayer = catalogPlayers.find(p => p.api_football_id === apiId);
      if (!catalogPlayer) continue;

      const s = playerStat.statistics?.[0] ?? {};
      const stats = {
        goals: s.goals?.total ?? 0,
        assists: s.goals?.assists ?? 0,
        saves: s.goals?.saves ?? 0,
        penaltySaves: s.penalty?.saved ?? 0,
        cleanSheet: (s.goals?.conceded ?? 1) === 0,
        shotsOnTarget: s.shots?.on ?? 0,
        keyPasses: s.passes?.key ?? 0,
        recoveries: s.tackles?.total ?? 0,
        clearances: s.tackles?.blocks ?? 0,
        goalsConceded: s.goals?.conceded ?? 0,
        yellowCards: s.cards?.yellow ?? 0,
        redCards: s.cards?.red ?? 0,
      };

      const oracleResult = runOracle({
        position: catalogPlayer.position as any,
        anchor: catalogPlayer.current_price,
        stats,
        competition: competition as Competition,
        isKnockout: false,
        previousStreak: catalogPlayer.streak ?? 0,
      });

      // Aplicar cap de +6% / -5%
      let finalChangePct = oracleResult.changePct;
      if (finalChangePct > 6.0) finalChangePct = 6.0;
      else if (finalChangePct < -5.0) finalChangePct = -5.0;

      const newPrice = Number((catalogPlayer.current_price * (1 + finalChangePct / 100)).toFixed(2));

      // 4. Actualizar precio en la BD
      await supabaseAdmin
        .from("players")
        .update({
          current_price: newPrice,
          price_change_pct: finalChangePct,
          streak: oracleResult.newStreak,
        })
        .eq("id", catalogPlayer.id);

      // 5. Guardar snapshot en historial
      await supabaseAdmin
        .from("price_history")
        .insert({ player_id: catalogPlayer.id, price: newPrice });

      // 6. Log del oráculo
      await supabaseAdmin.from("match_oracle_log").insert({
        player_id: catalogPlayer.id,
        api_fixture_id: fixture_id,
        competition,
        goals: stats.goals,
        assists: stats.assists,
        saves: stats.saves,
        clean_sheet: stats.cleanSheet,
        raw_score: oracleResult.rawScore,
        match_rating: oracleResult.matchRating,
        price_before: catalogPlayer.current_price,
        price_after: newPrice,
        change_pct: finalChangePct,
        streak_before: catalogPlayer.streak,
        streak_after: oracleResult.newStreak,
      });

      results.push({ player_id: catalogPlayer.id, price_after: newPrice, change_pct: finalChangePct });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
